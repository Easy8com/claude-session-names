import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionMessage } from 'claude-code'

import type { SessionRow } from '../types'

const PANE = 'sessions'
const MODEL = 'haiku'
const DIGEST_CHARS = 14000

const rows = atom({ plugin: 'session-names', key: 'rows' } as const, [])
const query = atom({ plugin: 'session-names', key: 'query' } as const, '')
const status = atom({ plugin: 'session-names', key: 'status' } as const, '')

// What the plugin remembers per session in $.store, under `s:<id>`.
type Named = {
  title?: string
  summary?: string
  namedAtTurn?: number
  isLocked?: boolean
  lastDoneAt?: string
}

type Scanned = {
  id: string
  cwd: string | null
  customTitle: string | null
  aiTitle: string | null
  firstPrompt: string | null
  lastPrompt: string | null
  lastDoneAt: string
  resumeDir: string | null
  origin: string | null
}

// Tag colors, picked by the tag's hash so a project keeps its color.
const TAG_COLORS = ['cyan', 'magenta', 'yellow', 'green', '#5fafff', '#ff8787', '#d7af5f', '#af87ff']
const TAG_WIDTH = 10

const SYSTEM = `You name coding-assistant sessions for a list the user searches later.
Read the conversation digest and answer with JSON only: {"title": "...", "summary": "..."}.
- title: 3 to 7 words, at most 60 characters, naming the main goal or outcome of the whole
  conversation so far, not just its first request. Use the language the user writes in.
  No quotes, no trailing period, no generic words like "session" or "help with".
- summary: one or two sentences, at most 220 characters, in the same language: what was done
  or decided, with concrete identifiers (repository, ticket numbers, file or feature names).
- When a current title is given and still fits the focus of the conversation, keep it exactly.`

const recordKey = (id: string) => `s:${id}`

async function recall($: EngineInterface, id: string): Promise<Named> {
  return ((await $.store.get(recordKey(id))) as Named | undefined) ?? {}
}

async function remember($: EngineInterface, id: string, patch: Named) {
  await $.store.set(recordKey(id), { ...(await recall($, id)), ...patch })
}

// Names at the first three turns, then every third, so a session that changes topic follows.
const isNamingTurn = (turn: number, namedAt = 0) =>
  turn > namedAt && (turn <= 3 || turn - namedAt >= 3)

const clip = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max)}…`

function digest(messages: readonly SessionMessage[]): string {
  const lines = messages.flatMap(m => {
    const tools = m.toolUses.map(t => t.tool)
    const text = m.text.replace(/\s+/g, ' ').trim()
    if (m.role === 'user') {
      return text && !m.toolResults?.length ? [`USER: ${clip(text, 700)}`] : []
    }
    const used = tools.length ? ` [tools: ${[...new Set(tools)].join(', ')}]` : ''

    return text || used ? [`ASSISTANT: ${clip(text, 400)}${used}`] : []
  })
  // Keep the opening request and as much of the recent conversation as fits.
  const head = lines.slice(0, 2)
  const tail: string[] = []
  let room = DIGEST_CHARS - head.join('\n').length
  for (const line of lines.slice(2).reverse()) {
    if ((room -= line.length + 1) < 0) break
    tail.unshift(line)
  }
  const skipped = lines.length - head.length - tail.length

  return [...head, ...(skipped > 0 ? [`… (${skipped} messages left out) …`] : []), ...tail].join('\n')
}

function parseNaming(text: string): { title: string; summary: string } | undefined {
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return undefined
  try {
    const { title, summary } = JSON.parse(json) as { title?: unknown; summary?: unknown }
    if (typeof title !== 'string' || !title.trim()) return undefined
    const clean = title.replace(/^["'„“]+|["'“”.]+$/g, '').replace(/\s+/g, ' ').trim()

    return { title: clip(clean, 60), summary: typeof summary === 'string' ? clip(summary.trim(), 240) : '' }
  } catch {
    return undefined
  }
}

async function nameSession($: EngineInterface, isForced: boolean): Promise<string> {
  const id = await $.session.id()
  const turn = await $.session.turns()
  const known = await recall($, id)
  if (known.isLocked && !isForced) return 'Auto-naming is off for this session.'
  if (!isForced && !isNamingTurn(turn, known.namedAtTurn)) return 'Not a naming turn.'

  const messages = await $.session.messages()
  const current = known.title ? `Current title: ${known.title}\n\n` : ''
  const reply = await $.model.complete({
    model: MODEL,
    system: SYSTEM,
    prompt: `${current}Conversation digest:\n${digest(messages)}`,
    maxTokens: 300,
    effort: 'low',
    timeoutMs: 30000,
  })
  if (!reply.isAnswered) return `No title: ${reply.reason}`
  const named = parseNaming(reply.text)
  if (!named) return 'No title: the reply was not JSON.'

  await remember($, id, { ...named, namedAtTurn: turn })
  if (named.title !== known.title) {
    // From a timer: a command hook (/autoname) may not run another command while it holds the turn.
    $.clock.after(0, () => {
      void $.command.run({ command: 'rename', args: named.title }).catch(err => $.ui.log(`session-names: ${String(err)}`))
    })
  }

  return `Session named: ${named.title}`
}

async function configDir($: EngineInterface) {
  return (await $.env.get('CLAUDE_CONFIG_DIR')) ?? `${(await $.env.get('HOME')) ?? ''}/.claude`
}

// Explicit tags from <config dir>/session-names/tags.json: { "~/code/backend": "API" }.
// Kept outside the plugin, so an update of the plugin leaves them alone.
async function loadAliases($: EngineInterface, config: string, home: string): Promise<Map<string, string>> {
  const path = `${config}/session-names/tags.json`
  try {
    if (!(await $.fs.exists(path))) return new Map()
    const raw = JSON.parse(await $.fs.read(path)) as Record<string, string>

    return new Map(Object.entries(raw).map(([dir, tag]) => [dir.replace(/^~(?=\/|$)/, home), tag]))
  } catch (err) {
    // A broken tags.json must not hide the list: fall back to the folder names.
    $.ui.toast(`session-names: tags.json ignored: ${(err as Error).message}`)
    return new Map()
  }
}

// Tags the model made up for projects, kept across sessions: { "/abs/path": "TAG" }.
const TAGS_KEY = 'tags'
const TAG_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,7}$/

const TAG_SYSTEM = `You make short tags for a list of coding projects, one per repository path.
Answer with JSON only: an object mapping each path exactly as given to its tag.
- A tag is 2 to 8 characters: capital letters, digits, at most one hyphen.
- Make it recognizable from the folder name; common abbreviations are welcome
  (devel -> DEV, frontend -> FE, opencode-otel -> OTEL, translatoid2 -> TRANS2).
- Every tag differs from the others and from the tags already in use.`

async function generatedTags($: EngineInterface): Promise<Record<string, string>> {
  return ((await $.store.get(TAGS_KEY)) as Record<string, string> | undefined) ?? {}
}

// Asks the model once for the projects that have no tag yet and keeps the answer.
async function generateTags($: EngineInterface, origins: readonly string[], used: readonly string[]) {
  const reply = await $.model.complete({
    model: MODEL,
    system: TAG_SYSTEM,
    prompt: `Tags already in use: ${used.join(', ') || 'none'}\n\nPaths:\n${origins.join('\n')}`,
    maxTokens: 800,
    effort: 'low',
    timeoutMs: 30000,
  })
  if (!reply.isAnswered) return {}
  const json = reply.text.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return {}

  const answered = JSON.parse(json) as Record<string, unknown>
  const taken = new Set(used)
  const made: Record<string, string> = {}
  for (const origin of origins) {
    const raw = answered[origin]
    const base = typeof raw === 'string' ? raw.trim().toUpperCase() : ''
    if (!TAG_PATTERN.test(base)) continue
    // Two projects never share a tag: the second gets a digit.
    let tag = base
    for (let n = 2; taken.has(tag); n++) tag = `${base.slice(0, 7)}${n}`
    taken.add(tag)
    made[origin] = tag
  }
  await $.store.set(TAGS_KEY, { ...(await generatedTags($)), ...made })

  return made
}

// Tags known without asking the model: an alias from tags.json, the home directory, /tmp.
function fixedTag(origin: string, home: string, aliases: Map<string, string>) {
  const alias = aliases.get(origin)
  if (alias) return alias
  if (origin === home) return '~'
  if (origin.startsWith('/tmp/')) return 'TMP'

  return undefined
}

// Until the model has named a project, its folder name stands in.
function folderTag(origin: string) {
  const name = origin.split('/').filter(Boolean).at(-1) ?? '?'
  // shop.example.com reads as SHOP.
  const short = /^[\w-]+(\.[a-z]{2,})+$/i.test(name) ? (name.split('.')[0] ?? name) : name

  return short.toUpperCase().slice(0, TAG_WIDTH)
}

function tagColor(tag: string) {
  let hash = 0
  for (const ch of tag) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0

  return TAG_COLORS[hash % TAG_COLORS.length]
}

async function loadRows($: EngineInterface): Promise<{ list: SessionRow[]; untagged: string[] }> {
  const config = await configDir($)
  const home = (await $.env.get('HOME')) ?? ''
  const aliases = await loadAliases($, config, home)
  const cache = `${home}/.cache/claude-session-names/scan.json`
  const run = await $.process.run(
    ['python3', '-I', `${$.plugin.root}/scripts/scan.py`, `${config}/projects`, cache],
    { timeoutMs: 120000 },
  )
  if (run.exitCode !== 0) throw new Error(run.stderr.trim().split('\n').at(-1) ?? 'scan failed')

  const scanned = JSON.parse(run.stdout) as Scanned[]
  const generated = await generatedTags($)
  const untagged = new Set<string>()
  const list = await Promise.all(
    scanned.map(async (s): Promise<SessionRow> => {
      const named = await recall($, s.id)
      const lastDoneAt =
        named.lastDoneAt && named.lastDoneAt > s.lastDoneAt ? named.lastDoneAt : s.lastDoneAt

      const cwd = s.resumeDir ?? s.cwd ?? ''
      const origin = s.origin ?? cwd
      const tag = fixedTag(origin, home, aliases) ?? generated[origin]
      if (!tag) untagged.add(origin)

      return {
        id: s.id,
        cwd,
        origin,
        tag: tag ?? folderTag(origin),
        // A /rename the person typed (custom title) wins over the plugin's own name.
        title: s.customTitle ?? named.title ?? s.aiTitle ?? s.firstPrompt ?? '(untitled)',
        summary: named.summary ?? '',
        firstPrompt: s.firstPrompt ?? '',
        lastPrompt: s.lastPrompt ?? '',
        lastDoneAt,
      }
    }),
  )

  return { list: list.sort((a, b) => (a.lastDoneAt < b.lastDoneAt ? 1 : -1)), untagged: [...untagged] }
}

const fold = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Every word of the query has to occur somewhere in the row.
function matches(row: SessionRow, words: readonly string[]) {
  const hay = fold([row.title, row.tag, row.summary, row.cwd, row.firstPrompt, row.lastPrompt, row.id].join(' '))

  return words.every(w => hay.includes(w))
}

function when(iso: string) {
  const d = new Date(iso)
  const two = (n: number) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`
}

async function tagProjects($: EngineInterface, untagged: readonly string[]) {
  const used = [...new Set((await read($, rows)).map(r => r.tag))]
  const made = await generateTags($, untagged, used)
  await update($, rows, list =>
    list.map(r => {
      const tag = made[r.origin]
      return tag ? { ...r, tag } : r
    }),
  )
}

async function openOverview($: EngineInterface, initial: string) {
  await update($, query, () => initial)
  await update($, status, () => 'Loading sessions…')
  await $.ui.open({ id: PANE, title: 'Sessions', focus: true, closeOnEscape: true })
  try {
    const { list, untagged } = await loadRows($)
    await update($, rows, () => list)
    await update($, status, () => '')
    if (untagged.length) {
      // Off the command's dispatch: the list shows at once, the tags follow.
      $.clock.after(0, () => {
        void tagProjects($, untagged).catch(err => $.ui.log(`session-names: tags: ${String(err)}`))
      })
    }
  } catch (err) {
    await update($, status, () => `Scan failed: ${(err as Error).message}`)
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'sessions',
      description: 'Finished sessions by last completion, searchable',
      argumentHint: '[search]',
    })
    await $.command.register({
      name: 'autoname',
      description: 'Name this session from the conversation (now | off | on)',
      argumentHint: 'now | off | on',
    })

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId === undefined && e.reason === 'answer') {
      const id = await $.session.id()
      await remember($, id, { lastDoneAt: new Date(await $.clock.now()).toISOString() })
      // Off the turn's dispatch: the model call must not hold the prompt.
      $.clock.after(0, () => {
        void nameSession($, false).catch(err => $.ui.log(`session-names: ${String(err)}`))
      })
    }

    return done
  })

  // A rename the person typed is theirs: stop renaming this session.
  on('command.run', { command: 'rename' }, async ($, e, next) => {
    if (e.origin.kind !== 'plugin') {
      await remember($, await $.session.id(), { isLocked: true })
    }

    return next(e)
  })

  on('command.run', { command: 'autoname' }, async ($, e) => {
    const id = await $.session.id()
    const arg = e.args.trim()
    if (arg === 'off') {
      await remember($, id, { isLocked: true })
      return { text: 'Auto-naming is off for this session.' }
    }
    if (arg === 'on') {
      await remember($, id, { isLocked: false })
    }

    return { text: await nameSession($, true) }
  })

  on('command.run', { command: 'sessions' }, async ($, e) => {
    await openOverview($, e.args.trim())

    return { text: 'Sessions pane opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const table = $.ui.resolve(e)
    const { Box, Text, Button } = table
    const list = await read($, rows)
    const q = await read($, query)
    const note = await read($, status)
    const words = fold(q).split(/\s+/).filter(Boolean)
    const found = words.length ? list.filter(r => matches(r, words)) : list
    const room = Math.max(3, (e.viewport?.rows ?? 30) - 6)
    const width = e.props.bodyColumns
    const tagWidth = Math.max(1, ...found.slice(0, room).map(r => r.tag.length))

    const resume = async (row: SessionRow) => {
      const cmd = `cd '${row.cwd}' && claude --resume ${row.id}`
      const copied = await $.ui.copy({ text: cmd, surface: e.surface })
      $.ui.toast(copied.isCopied ? `Copied: ${cmd}` : cmd)
    }

    return (
      <Box flexDirection="column">
        {'Input' in table ? (
          <table.Input
            key="q"
            label="Search"
            placeholder="words from title, summary, prompt or path"
            value={q}
            autoFocus
            onInput={value => void update($, query, () => value)}
            onSubmit={value => void update($, query, () => value)}
          />
        ) : (
          q && <Text>Search: {q}</Text>
        )}
        <Text dimColor>
          {note || `${found.length} of ${list.length} sessions · Enter copies the resume command · Esc closes`}
        </Text>
        {found.slice(0, room).map(row => (
          <Button key={row.id} plain onPress={() => void resume(row)}>
            <Text dimColor>{when(row.lastDoneAt)} </Text>
            <Text color={tagColor(row.tag)}>{`[${row.tag}]`.padEnd(tagWidth + 3)}</Text>
            {clip(row.title, Math.max(20, width - tagWidth - 21))}
          </Button>
        ))}
        {found.length > room && <Text dimColor>… {found.length - room} more, narrow the search</Text>}
      </Box>
    )
  })
}
