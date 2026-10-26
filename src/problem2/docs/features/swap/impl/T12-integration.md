# T12 — Automated QA loop

Status: done
Depends: T06, T07, T08, T09, T10, T11
Owns: anything needed to make the gate green; coordinate with the owner task if it is still open. `docs/features/swap/plan.md` only via an escalation
Read: [`automation.md`](automation.md), then everything in this folder

## Goal

Get `pnpm verify` green with no human in the loop, following [`automation.md`](automation.md),
then hand over to T13.

## Checklist

- [x] All slot comments replaced; no leftover placeholders
- [x] Loop run until green; every iteration logged below
- [x] All 68 e2e tests pass; `--repeat-each=3` green
- [x] Unused code/exports removed (`noUnusedLocals` catches locals, not exports)
- [x] Handover checklist in `automation.md` complete

## QA log

| #   | Failing test | Cause | Fix | Files |
| --- | ------------ | ----- | --- | ----- |

## Escalations

<none>

## Handoff notes

- Done: `pnpm verify` green twice (68/68 e2e each), `--repeat-each=3` 204/204, no slots / `console.log` / `TODO` left.
- Kept on purpose: `IconName` and `typedSideAtom` exports are part of `contracts.md` / used as types.
- e2e: full suite 68 passed (32.5s, 35.9s); repeat 204 passed (1.1m).
- Follow-ups: T13.
