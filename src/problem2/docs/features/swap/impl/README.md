# Swap — implementation plan

How the swap feature gets built by several agents working in parallel. The **what** lives in
[`../plan.md`](../plan.md) (rules) and the e2e specs; the **look** in [`design.md`](design.md);
the **seams between tasks** in [`contracts.md`](contracts.md); the **test gate** in
[`automation.md`](automation.md). Each task is one file `Txx-*.md`.

Read before starting any task: `AGENTS.md`, `../plan.md`, `design.md`, `contracts.md`, your task file.

## Waves

Tasks in the same wave can run at the same time. A task starts once every task in its
"Depends" line is `done`.

```
Wave 0  T00 foundation
          │
Wave 1  T01 number lib   T02 prices api   T03 wallet state   T04 pixel ui
          └──────┬───────────┘                 │    └──────┐       │
Wave 2        T05 swap state ◄─────────────────┘        T06 wallet header
                 │
Wave 3  T08 token picker (first: unblocks most e2e)
        T07 panels   T09 rate+details+settings   T10 submit+prices   T11 review+toast
                 │
Wave 4  T12 automated QA loop  →  T13 manual testing
```

| Task                                | Title                             | Depends       | Wave |
| ----------------------------------- | --------------------------------- | ------------- | ---- |
| [T00](T00-foundation.md)            | App shell, theme, fonts           | –             | 0    |
| [T01](T01-number-lib.md)            | Parse, format, convert            | –             | 1    |
| [T02](T02-prices-api.md)            | Prices fetch + cleanup            | –             | 1    |
| [T03](T03-wallet-state.md)          | Demo wallet storage + atoms       | –             | 1    |
| [T04](T04-pixel-ui.md)              | PixelIcon, Spinner, TokenIcon     | T00           | 1    |
| [T05](T05-swap-state.md)            | Swap atoms + SwapCard slots       | T01, T02, T03 | 2    |
| [T06](T06-wallet-header.md)         | Mode switch, connect, menu        | T03, T04      | 2    |
| [T07](T07-panels.md)                | Sell/Buy panels, presets, flip    | T04, T05      | 3    |
| [T08](T08-token-picker.md)          | Token picker dialog               | T04, T05      | 3    |
| [T09](T09-rate-details-settings.md) | Rate, details, settings           | T04, T05      | 3    |
| [T10](T10-submit-prices.md)         | Submit button, price states       | T04, T05      | 3    |
| [T11](T11-review-toast.md)          | Review dialog, swap toast         | T04, T05      | 3    |
| [T12](T12-integration.md)           | Automated QA loop (`pnpm verify`) | T06–T11       | 4    |
| [T13](T13-manual-test.md)           | Manual testing                    | T12           | 5    |

Status lives in each task file (`Status:` line), not in this table, so parallel agents never
edit the same lines.

## Protocol

1. **Claim:** set your task's `Status:` to `doing — <agent>, branch <branch>`. Commit that
   alone first so others see it. Branch: `swap/Txx-short-name` (or a worktree on it).
2. **Stay in your lane:** only create/edit files in your task's **Owns** list. Need a change in
   someone else's file (a new atom, a new prop)? Don't make it. Write it under
   _Handoff notes → Requests_ in your task file and tell the lead.
3. **Contracts are fixed:** names and signatures in `contracts.md` are what other tasks build
   against. Changing one needs the lead's OK and an update to `contracts.md` in the same commit.
4. **The e2e specs are the acceptance test.** Never edit `e2e/*` to make a test pass. If a
   test contradicts `plan.md`, stop and raise it.
5. **Slots:** `App.tsx` and `SwapCard.tsx` contain `{/* slot: Txx … */}` lines. Replace only
   your own slot line(s) with your component. That keeps merges conflict-free.
6. **Done:** tick every checklist box, fill in _Handoff notes_, set `Status: review`, commit
   (`feature(problem2): …`). The lead merges and sets `done`.

## Definition of done (every task)

- [ ] Checklist in the task file all ticked
- [ ] `pnpm check` passes (typecheck + oxlint + prettier)
- [ ] `pnpm exec vitest run` passes; new pure logic has tests next to it
- [ ] Ran the [automation loop](automation.md) scoped to the task's e2e filter until green
- [ ] The task's e2e filter passes (`pnpm test:e2e -g "<filter>"`), or the notes say which
      task it is still waiting on
- [ ] Only files in **Owns** touched
- [ ] Looks right in light **and** dark (`prefers-color-scheme`) and at 375px wide (UI tasks)
- [ ] Handoff notes filled in

## Handoff notes template

Copy into your task file's _Handoff notes_ when you finish:

```md
- Done: <one line per thing delivered>
- Deviations from plan/contracts: <none | what and why>
- Requests to other tasks: <none | Txx: what you need>
- e2e: <filter> → <n passed / n failed, and why>
- Follow-ups: <none | what the next agent should know>
```
