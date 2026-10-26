# T13 — Manual testing

Status: ready
Depends: T12
Owns: nothing (report only). Bugs found go back to T12's loop as new rows
Read: `../plan.md`, `design.md`

## Build under test

Uncommitted working tree on `main` after `979dbbd`. `pnpm verify`: check ✓, 74 unit ✓, build ✓, 68/68 e2e ✓ (twice); `--repeat-each=3` 204/204.

## Checklist

Things the automated gate can't judge:

- [ ] Looks right: light + dark, 375px / 768px / 1280px; screenshots attached to the PR
- [ ] Keyboard only: tab through header → card → picker → settings → review → confirm, visible focus everywhere
- [ ] Screen reader smoke (VoiceOver): labels on every input, submit state announced, toast announced
- [ ] `prefers-reduced-motion` and `prefers-contrast: more`
- [ ] Real network: live prices load, token icons load, letter fallback for missing icons
- [ ] Feel: animations step cleanly, press effect, toast timing
- [ ] `plan.md` still matches behaviour

## Findings

| #   | What | Severity | Back to |
| --- | ---- | -------- | ------- |
