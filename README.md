# session-names

A Claude Code plugin that gives sessions names that describe what they were about, and a searchable overview of your finished sessions.

- **Names from the whole conversation.** Claude Code titles a session from its first prompt. This plugin renames the session after the first, second and third turn, then after every third turn, from a digest of the conversation so far. A session that drifts to another topic gets a new name; one that stays on topic keeps its name.
- **`/sessions`**: a pane listing every session of every project, newest completion first, with a search field. Each row shows when the session last finished a turn, a project tag and the title.
- **`cs` in the terminal.** Type `cs`, find the session, press Enter: it resumes right there, in its own folder. `/install-cs` sets it up, no editor needed.
- **Project tags.** `[API]`, `[WEB]`, `[DOCS]`: a short tag for the repository the session belongs to. A session in a git worktree is tagged by the repository the worktree was made from, so all work on one project carries one tag.

```
Search: login
3 of 134 sessions · Enter copies the resume command · Esc closes
2026-10-20 07:48 [API]  OAuth login for the mobile client
2026-10-19 18:27 [API]  Fix session expiry on login
2026-10-15 07:48 [WEB]  Login page redesign
```

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install session-names --marketplace Easy8Com/claude-session-names
```

From a shell:

```
claude plugin install session-names --marketplace Easy8Com/claude-session-names
```

Answer `y` to add the marketplace, then pick a scope (user scope makes it work in every project).

To get a newer version, from a shell, then restart Claude Code:

```
claude plugin marketplace update claude-session-names
claude plugin update session-names@claude-session-names
```

Requirements: Claude Code with function-hook plugins (2.1.300 or newer) and `python3` on `PATH` (the transcript scanner uses only the standard library).

## Commands

| Command | What it does |
| --- | --- |
| `/sessions [search]` | Opens the overview pane, optionally pre-filled with a search. |
| `/autoname now` | Names the current session from the conversation right now. |
| `/autoname off` | Stops automatic renaming for the current session. |
| `/autoname on` | Turns it back on and names the session. |
| `/install-cs` | Adds the `cs` shell command (below) to your shell's startup file. |
| `/install-cs remove` | Takes it out again. |

### The overview pane

- Type to search. Every word has to match somewhere in the title, the summary, the project tag, the path, the first or last prompt, or the session id. Diacritics are ignored (`skoleni` finds `Školení`).
- Sessions are sorted by their last completed turn, newest first.
- Down moves from the search field to the list. Enter on a row copies `cd '<dir>' && claude --resume <id>` to the clipboard. `<dir>` is the directory the session's transcript is kept under, so the resume works for worktree sessions too. Opened by `cs`, Enter resumes the session instead.
- Esc closes the pane.

## Resume from the terminal: `cs`

Claude Code resumes a session in place only when it belongs to the folder you started in. `cs` gets around that: it opens the overview from your shell, and Enter resumes the session in the same terminal, in the session's own folder. No clipboard, no second terminal.

Set it up once, at the prompt of any Claude Code session:

```
/install-cs
```

It adds a short `cs` function to your shell's startup file: `~/.bashrc` for bash (`~/.bash_profile` on macOS), `~/.zshrc` for zsh. Then open a new terminal:

```
cs           # every session
cs login     # the overview with "login" already searched
```

- Type to search, Down to the list, Enter on a session resumes it. Esc cancels and leaves you in the shell.
- The first time, Claude Code asks whether you trust `~/.cache/claude-session-names/picker`; answer yes. The overview runs from that folder, so a terminal that starts in your home directory is not asked every time.
- When you leave the session, the terminal stays in its folder.
- `/install-cs` again replaces the function with the current one. Run `/install-cs remove` before you uninstall the plugin.
- `cs` works in bash and zsh.

## How naming works

After a turn ends, the plugin sends a digest of the conversation (the opening request plus as much of the recent conversation as fits in about 14,000 characters) to `haiku` and asks for a 3 to 7 word title and a one-sentence summary in the language of the conversation. The current title goes along, and the model keeps it when it still fits. The title is applied with the built-in `/rename`; the summary is stored for search.

- Naming runs in the background after the turn, so it never delays your next prompt.
- A `/rename` you type yourself wins: the plugin stops renaming that session. `/autoname on` hands it back.
- Each naming is one small `haiku` call on your own Claude Code account. Tagging new projects is one more call, made only when `/sessions` finds a project without a tag.
- Sessions from before you installed the plugin keep their old titles; run `/autoname now` in one to rename it.

## Project tags

Tags need no setup: install the plugin, open `/sessions`, and every project gets a tag.

**Which project a session belongs to.** The plugin finds the repository from the session's directory:

1. A Claude Code worktree (`<repo>/.claude/worktrees/<name>`) belongs to `<repo>`.
2. A git worktree elsewhere belongs to the repository its `.git` file points to.
3. A worktree that has since been removed is matched through the other directories the session worked in, or by the `_workspaces/<repo>/<task>` convention.
4. A directory that is not in a git repository is its own project.

**What the tag says.** The first time `/sessions` meets a project, it asks `haiku` for a short tag of 2 to 8 characters made from the folder name (`devel` → `DEV`, `frontend` → `FE`, `opencode-otel` → `OTEL`). All new projects go in one call, and no two projects get the same tag. The tags are kept, so a project keeps its tag, and its color, from then on. Until the answer arrives (a second or two, the first time only), the folder name in capitals stands in. Your home directory is always `~`, anything under `/tmp` is `TMP`.

**Your own tags (optional).** To pick a tag yourself, put it in `~/.claude/session-names/tags.json` (under `$CLAUDE_CONFIG_DIR` if you set it), keyed by the repository's path. A tag there wins over the generated one:

```json
{
  "~/code/backend": "API",
  "~/code/frontend/web": "WEB"
}
```

The file is read each time the pane opens.

## Data and privacy

- The scanner reads the transcripts under `~/.claude/projects` and keeps an index in `~/.cache/claude-session-names/scan.json`, so later scans read only changed files.
- Titles, summaries and project tags the plugin generated are kept in the plugin's own Claude Code store.
- The conversation digest and the paths of your project folders (for the tags) go to the model through your Claude Code session, the same way the session's own requests do. Nothing is sent anywhere else.

## Development

```
claude --plugin-dir /path/to/claude-session-names   # run a session with the working copy
claude plugin validate /path/to/claude-session-names
claude plugin test /path/to/claude-session-names
```

`hooks/register.tsx` is the hooks module (naming, commands, the pane), `scripts/scan.py` the transcript scanner, `types/index.d.ts` the plugin's state contract. Once Claude Code has loaded the plugin from a folder it writes the API types to `.claude-plugin/types/`, and `tsc -p .` type-checks the module.

## License

[MIT](LICENSE)
