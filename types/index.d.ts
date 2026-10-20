export type SessionRow = {
  id: string
  /** Where `claude --resume` finds the session: the directory its transcript is kept under. */
  cwd: string
  /** The repository the session belongs to, a worktree resolved to its main checkout. */
  origin: string
  /** The project, short: [API] for a repository and its worktrees alike. */
  tag: string
  title: string
  summary: string
  firstPrompt: string
  lastPrompt: string
  lastDoneAt: string
}

declare module 'claude-code' {
  interface PluginState {
    'session-names': {
      rows: SessionRow[]
      query: string
      status: string
    }
  }
}
