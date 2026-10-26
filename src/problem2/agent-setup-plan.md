# Agent Setup Plan — Vite + Express repo

Handoff spec for Claude Code. Goal: set up agent instructions, hooks and feature
docs so any coding agent (Claude Code, Codex, Cursor, Copilot) works well in this
repo, with Claude Code getting extra automation.

**How to execute:** first inspect the repo (package manager, folder layout, scripts,
lint/test setup, DB tooling). Adapt everything below to what actually exists. Never
invent commands or conventions — if something is unknown, leave a `TODO:` and list
it in your final summary. Work in phases; stop after each phase for review.

---

## Decisions already made (do not re-litigate)

1. **AGENTS.md is the single source of truth** for instructions. CLAUDE.md files are
   one-line shims (`@AGENTS.md`) so old Claude Code versions (< 2.1.277) and new ones
   both load it, and other tools read AGENTS.md directly.
2. **Files live at the repo root and next to the code**, not in `.claude/`.
   `.claude/` holds only machinery: settings, hooks.
3. **Split by sub-project only:** root + `client/` + `server/`. No per-feature
   AGENTS.md and no `.claude/rules/` system for now (judged overkill at this size).
4. **Keep files short:** each AGENTS.md well under 150 lines. Only include what an
   agent can't infer from code: exact commands, structure, non-default conventions,
   "do not" rules, gotchas. No generic advice ("write clean code").
5. **Hooks, minimal set:** lint-fix per edit (fast, single file), typecheck at end of
   turn (Stop), protect sensitive files (PreToolUse). No per-edit `tsc`, no per-edit
   test runs (noisy mid-refactor, slow).
6. **Jira = why/what was asked. Repo docs = how it works now.** Feature behavior lives
   in `docs/features/<feature>.md`, updated in the same PR as the code.
7. **Docs freshness = same-PR updates + visible skips:** AGENTS.md instruction, PR
   template checkbox, CI _warning_ (never a hard block).

---

## Phase 1 — Instruction files

### Target layout

```
AGENTS.md            ← shared baseline (real content)
CLAUDE.md            ← @AGENTS.md  (+ short "Claude Code only" section)
client/AGENTS.md     ← client-only rules
client/CLAUDE.md     ← @AGENTS.md
server/AGENTS.md     ← server-only rules
server/CLAUDE.md     ← @AGENTS.md
CLAUDE.local.md      ← add to .gitignore (personal notes, optional)
```

If CLAUDE.md files already exist, migrate their content into the matching AGENTS.md
and replace them with the shim. Don't lose content.

### Root AGENTS.md sections (in this order)

- **Project** — 1–2 sentences: what the app does.
- **Stack** — frontend, backend, DB/ORM, package manager (+ "don't use others"), Node version.
- **Repo layout** — short tree with one-line purpose per folder.
- **Commands** — dev (both / client / server), test, single test file, lint,
  typecheck, DB migrate. Then: _"Before saying a task is done: run
  `<typecheck> && <lint> && <test>`."_
- **How client and server connect** — dev proxy (`/api` → server port), how
  production serves `client/dist`, where shared types/schemas live, auth mechanism.
- **Shared conventions** — TypeScript strictness, path aliases, commit style.
- **Do not** — edit generated files / applied migrations, commit `.env*`, add
  dependencies without stating why, change DB schema without a migration.
- **Gotchas** — leave `TODO:` placeholders; humans fill these over time.
- **Feature docs** — paste the block from Phase 3.
- **Reference implementations** — "copy these patterns": one good route+service+test,
  one good page. Pick real files from the repo; if none are clean enough, TODO.

### client/AGENTS.md

Component patterns, data fetching/server state library, styling system,
`VITE_` env rule (no secrets in client), client test setup (e.g. Testing Library + MSW).

### server/AGENTS.md

Route → service → db layering (routes thin, no req/res in services), input
validation, error handling pattern (central error middleware), config access
(single config module, no scattered `process.env`), DB/migration workflow,
server test setup (e.g. Supertest against app instance).

Only document what is actually true in the codebase. Where the code is inconsistent,
describe the pattern used by the best existing example and flag it.

---

## Phase 2 — Claude Code hooks

`.claude/settings.json` (merge with existing settings if present):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/protect-files.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/lint-file.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/typecheck.sh"
          }
        ]
      }
    ]
  }
}
```

`.claude/hooks/protect-files.sh` — block edits to sensitive paths (exit 2 = blocked,
stderr is shown to Claude):

```bash
#!/usr/bin/env bash
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  *.env|*.env.*|*/.env|*pnpm-lock.yaml|*package-lock.json|*/migrations/*|*/dist/*)
    echo "Blocked: $file is protected. Ask the user if this edit is really needed." >&2
    exit 2 ;;
esac
exit 0
```

Adjust the patterns to the repo: lockfile name, migrations folder, generated files.
Note: blocking `migrations/*` also blocks _creating_ new migrations by hand — if the
team creates migrations via a CLI command, that's fine; otherwise narrow the rule.
Allow `.env.example`.

`.claude/hooks/lint-file.sh` — auto-fix the edited file, report what's left:

```bash
#!/usr/bin/env bash
file=$(jq -r '.tool_input.file_path // empty')
[[ "$file" =~ \.(ts|tsx|js|jsx)$ ]] || exit 0
out=$(npx eslint --fix "$file" 2>&1) || { echo "$out" >&2; exit 2; }
exit 0
```

If the repo uses Prettier or Biome, run the formatter here too. Keep it under ~1s.

`.claude/hooks/typecheck.sh` — end-of-turn gate:

```bash
#!/usr/bin/env bash
out=$(<package-manager> typecheck 2>&1) || { echo "$out" | head -40 >&2; exit 2; }
exit 0
```

Replace `<package-manager> typecheck` with the repo's real command. If no
`typecheck` script exists, add one (`tsc --noEmit` per sub-project).

Then: `chmod +x .claude/hooks/*.sh`, confirm `jq` is available, and test each hook by
piping sample JSON, e.g.
`echo '{"tool_input":{"file_path":"server/.env"}}' | .claude/hooks/protect-files.sh; echo $?`

---

## Phase 3 — Feature docs and decisions

Create:

```
docs/features/README.md   ← what these are, the template below, update rule
docs/adr/README.md        ← ADR convention + index table
docs/adr/0001-record-architecture-decisions.md
```

Feature doc template (only for features with non-obvious rules; plain CRUD gets none):

```md
# <Feature>

## Rules

- <business rules, status flows, invariants>

## Gotchas

- <surprising behavior, edge cases>

## History

- <Jira keys for original spec and major changes — link, don't copy>
```

Target ~20–40 lines. Document rules, not endpoints.

ADR convention: one file per decision, `NNNN-kebab-title.md`, status
Proposed → Accepted → Superseded by ADR-NNNN; accepted ADRs are not edited, a new one
supersedes them. Write one only for decisions that are hard to reverse or likely to
be questioned.

Block to add to root AGENTS.md:

```md
## Feature docs

- Feature behavior is documented in docs/features/<feature>.md.
  Read the relevant one before changing a feature.
- If your change alters a business rule, status flow, or edge case, update that
  doc in the same change. If unsure, say so in your summary.
- Don't touch feature docs for refactors that don't change behavior.
- Big, hard-to-reverse technical decisions get an ADR in docs/adr/.
```

Do **not** draft feature docs by guessing from code. Instead, list candidate features
with non-obvious rules in the final summary and ask which to document first.

---

## Phase 4 — Keeping docs fresh

`.github/pull_request_template.md` (merge if one exists):

```md
- [ ] Behavior changed? Updated `docs/features/…` (or N/A)
- [ ] Big technical decision? Added an ADR in `docs/adr/` (or N/A)
```

`.github/workflows/doc-check.yml` — warning only, never fails the build:

```yaml
name: Feature doc check
on: pull_request
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: |
          changed=$(git diff --name-only origin/${{ github.base_ref }}...HEAD)
          check() {
            if echo "$changed" | grep -q "^$1" && ! echo "$changed" | grep -q "^$2"; then
              echo "::warning::$1 changed but $2 did not — update it if behavior changed"
            fi
          }
          # one line per documented feature: code path → doc
          # check server/src/services/orders docs/features/orders.md
```

Leave the `check` lines commented until feature docs exist. If the repo isn't on
GitHub, skip this file and mention it in the summary.

---

## Explicitly out of scope (revisit only if a real problem appears)

- `.claude/rules/` path-scoped rules and the shared `docs/rules/` + symlink system
  → add only when an AGENTS.md exceeds ~200 lines or agents keep missing a domain rule.
- Per-feature AGENTS.md files → only if code is restructured into feature folders.
- Generating Cursor/Copilot native rule formats.
- Per-edit typecheck or test hooks.

## Final summary should include

- Files created/changed per phase.
- Every `TODO:` left and what's needed to fill it.
- Candidate features for `docs/features/`.
- Anything in the repo that contradicts this plan.
