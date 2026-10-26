@AGENTS.md

## Claude Code only

- Hooks (`.claude/settings.json`) run oxlint `--fix` + Prettier on each edited file, typecheck at end of turn,
  and block edits to `.env*`, `pnpm-lock.yaml`, `dist/`, `node_modules/`, `.problem/`.
- Hooks load only when Claude Code is started from `src/problem2/`.
