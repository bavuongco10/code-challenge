# User stories

One Cucumber feature file per user story. Spec: [../README.md](../README.md). Build phases: [../IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md).

| Story | File | Who / what | Phase | Scenarios |
|---|---|---|---|---|
| US-01 | [01-login-with-passkey.feature](./01-login-with-passkey.feature) | A player logs in with a passkey | 1 | 2 |
| US-02 | [02-session-protection.feature](./02-session-protection.feature) | A player's session can't be misused | 1 | 8 |
| US-03 | [03-earn-points.feature](./03-earn-points.feature) | A player earns points for an action | 2 | 3 |
| US-04 | [04-fair-play.feature](./04-fair-play.feature) | Nobody raises a score without earning it | 2 | 7 |
| US-05 | [05-reliable-scoring.feature](./05-reliable-scoring.feature) | Points are never lost or doubled on failure | 2 | 4 |
| US-06 | [06-view-top-10.feature](./06-view-top-10.feature) | A visitor sees the top 10 | 3 | 6 |
| US-07 | [07-live-updates.feature](./07-live-updates.feature) | A visitor watches the top 10 change live | 4 | 6 |
| US-08 | [08-moderate-players.feature](./08-moderate-players.feature) | An admin flags, bans and corrects scores | 5 | 4 |
| US-09 | [09-rate-limits.feature](./09-rate-limits.feature) | The operator rate-limits scripts | 5 | 3 |

**Total:** 43 scenarios, 25 of them tagged `@security`.

## Running a subset

```sh
cucumber-js --tags @US-04      # one story
cucumber-js --tags @phase-2    # everything a phase must pass
cucumber-js --tags @security   # requirement 5: no unauthorised score increases
```
