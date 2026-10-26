# Automated QA loop

Runs before anything goes to a human. An agent loops **verify → triage → fix → verify** until
the whole gate is green, and only then hands over for manual testing (T13).

## The gate

```sh
pnpm verify   # check (tsc + oxlint + prettier) → vitest run → vite build → playwright test
```

It stops at the first failing stage, so fix stages in that order. Useful narrower runs:

| Need                  | Command                                                         |
| --------------------- | --------------------------------------------------------------- |
| Static only           | `pnpm check`                                                    |
| Unit tests            | `pnpm exec vitest run`                                          |
| One e2e area          | `pnpm test:e2e -g "<describe or test name>"`                    |
| Only last failures    | `pnpm test:e2e --last-failed`                                   |
| Flake hunt            | `pnpm test:e2e -g "<name>" --repeat-each=10`                    |
| Look at a failure     | `pnpm exec playwright show-trace test-results/<test>/trace.zip` |
| Drive the app by hand | `playwright-cli` against `pnpm dev`                             |

Failed e2e tests keep a trace in `test-results/` and an HTML report in `playwright-report/`
(both git-ignored).

## Loop

1. Run `pnpm verify`. Green → go to [Handover](#handover).
2. Take the **first** failure and classify it:

   | Cause                                      | Action                                                                                 |
   | ------------------------------------------ | -------------------------------------------------------------------------------------- |
   | App bug (behaviour differs from `plan.md`) | Fix in the owning task's files (`contracts.md` → Files)                                |
   | Missing id/class from the UI contract      | Add it; never rename the test's selector                                               |
   | Timing / flake (passes on rerun)           | Fix the cause (missing await, animation, stale state); no `waitForTimeout`, no retries |
   | Test contradicts `plan.md`                 | **Stop.** Log it under _Escalations_, ask the lead                                     |
   | Contract change needed                     | **Stop.** Same as above                                                                |

3. Write the fix, add a unit test if the bug was in pure logic, rerun the narrow command,
   then go back to step 1.
4. Log each iteration in T12's _QA log_: `#n · failing test · cause · fix · files`.

**Never** to get green: edit `e2e/*`, skip/`.only`/`.fixme` a test, raise timeouts, add retries,
or loosen lint/tsconfig. If the same test fails 3 iterations in a row, or 10 iterations pass
without the gate going green, stop and escalate with the log.

## Handover

Only when all of these hold:

- [ ] `pnpm verify` green twice in a row (second run proves no flake)
- [ ] `pnpm test:e2e --repeat-each=3` green
- [ ] `git status` clean apart from intended changes; no `console.log`, no `TODO` left by the loop
- [ ] QA log and escalations filled in T12
- [ ] T13 marked ready: paste the final `pnpm verify` summary lines into T13's _Build under test_
