import { expect, mock, test } from 'claude-code/testing'

const SCANNED = [
  {
    id: 'older',
    cwd: '/home/t/code/backend',
    customTitle: null,
    aiTitle: 'Fix login',
    firstPrompt: 'oprav prihlaseni',
    lastPrompt: null,
    lastDoneAt: '2026-10-01T10:00:00.000Z',
    resumeDir: '/home/t/code/_workspaces/backend/backend-42-login',
    origin: '/home/t/code/backend',
  },
  {
    id: 'newer',
    cwd: '/home/t/code/shop.example.com',
    customTitle: 'Školení nových kolegů',
    aiTitle: null,
    firstPrompt: 'priprav osnovu',
    lastPrompt: 'dopln agendu',
    lastDoneAt: '2026-10-19T10:00:00.000Z',
    resumeDir: '/home/t/code/shop.example.com',
    origin: '/home/t/code/shop.example.com',
  },
]

const PANE_PROPS = {
  title: 'Sessions',
  isFocused: true,
  bodyColumns: 100,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 30 },
  view: {},
}

test('the overview lists sessions newest first and searches without diacritics', async ($, on) => {
  mock.store(on)
  mock.clock(on)
  mock.env(on, { HOME: '/home/t' })
  on('process.run', () => ({
    value: { exitCode: 0, stdout: JSON.stringify(SCANNED), stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('ui.open', () => ({ value: { isPlaced: true as const } }))
  on('fs.exists', () => ({ value: false }))

  await $.command.run({
    command: 'sessions',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 160 },
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({
      plugin: 'session-names',
      surface,
      component: 'Pane',
      requestId: 'sessions',
      props: PANE_PROPS,
    })
    const first = await ui.find({ type: 'Button' })
    expect(first?.key).toBe('newer')
    // A worktree of backend is tagged by the repository it comes from, not its own folder.
    expect(await ui.find({ type: 'Text', text: /\[BACKEND\]/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /\[SHOP\]/ })).toBeDefined()

    await ui.input({ key: 'q', text: 'skoleni', kind: 'change' })
    expect((await ui.find({ key: 'newer' }))).toBeDefined()
    expect((await ui.find({ key: 'older' }))).toBeUndefined()
    expect((await ui.find({ type: 'Text', text: /1 of 2 sessions/ }))).toBeDefined()

    await ui.input({ key: 'q', text: 'backend', kind: 'change' })
    expect(await ui.find({ key: 'older' })).toBeDefined()
    expect(await ui.find({ key: 'newer' })).toBeUndefined()

    await ui.input({ key: 'q', text: '', kind: 'change' })
    await ui.unmount()
  }
})

test('/autoname now renames the session from the conversation', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  const renamed: string[] = []
  on('session.id', () => ({ value: 'abc' }))
  on('session.turns', () => ({ value: 5 }))
  on('session.messages', () => ({
    value: [
      { role: 'user' as const, text: 'ahoj, pomoz mi s dockerem', toolUses: [] },
      { role: 'assistant' as const, text: 'Jasně.', toolUses: [] },
      { role: 'user' as const, text: 'vlastně nasaď plugin do stagingu', toolUses: [] },
    ],
  }))
  on('model.complete', ($, e) => {
    expect(e.prompt).toContain('nasaď plugin')
    return {
      value: {
        isAnswered: true as const,
        text: '```json\n{"title": "Nasazení pluginu do stagingu.", "summary": "Plugin nasazen."}\n```',
        usage: {
          input_tokens: 1,
          output_tokens: 1,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      },
    }
  })
  on('command.run', { command: 'rename' }, ($, e) => {
    renamed.push(e.args)
    return { text: `Session renamed to: ${e.args}` }
  })

  const run = await $.command.run({
    command: 'autoname',
    args: 'now',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 160 },
  })

  expect(run.text).toBe('Session named: Nasazení pluginu do stagingu')
  await clock.advance(1)
  expect(renamed).toEqual(['Nasazení pluginu do stagingu'])
})

test('projects without a tag get one from the model, kept for later', async ($, on) => {
  mock.store(on)
  const clock = mock.clock(on)
  mock.env(on, { HOME: '/home/t' })
  on('process.run', () => ({
    value: { exitCode: 0, stdout: JSON.stringify(SCANNED), stderr: '', isStdoutTruncated: false, isStderrTruncated: false },
  }))
  on('ui.open', () => ({ value: { isPlaced: true as const } }))
  on('fs.exists', () => ({ value: false }))
  let asked = 0
  on('model.complete', () => {
    asked += 1
    return {
      value: {
        isAnswered: true as const,
        // Lower case is accepted, and a clash is resolved: the second BE becomes BE2.
        text: JSON.stringify({ '/home/t/code/backend': 'be', '/home/t/code/shop.example.com': 'BE' }),
        usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      },
    }
  })
  const open = () =>
    $.command.run({
      command: 'sessions',
      args: '',
      origin: { kind: 'composer' },
      presentation: { isFullscreen: true, columns: 160 },
    })

  await open()
  await clock.advance(1)
  const ui = await $.ui.mount({
    plugin: 'session-names',
    surface: 'terminal',
    component: 'Pane',
    requestId: 'sessions',
    props: PANE_PROPS,
  })
  expect(await ui.find({ type: 'Text', text: /\[BE\]/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /\[BE2\]/ })).toBeDefined()
  await ui.unmount()

  // The tags are kept: opening the overview again asks the model nothing.
  await open()
  await clock.advance(1)
  expect(asked).toBe(1)
})
