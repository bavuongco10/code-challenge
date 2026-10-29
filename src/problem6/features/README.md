# Acceptance scenarios

The three core stories, in Cucumber format. Spec: [../README.md](../README.md). Build phases: [../IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md).

| Story | File | What | Phase |
|---|---|---|---|
| US-01 | [01-earn-points.feature](./01-earn-points.feature) | A real action earns points, exactly once | 2 |
| US-02 | [02-replay-and-cheating-rejected.feature](./02-replay-and-cheating-rejected.feature) | Replays, forged tokens, instant finishes and fake proofs earn nothing | 2 |
| US-03 | [03-live-top-10.feature](./03-live-top-10.feature) | Viewers see the top 10 change live | 4 |

Everything else (top-10 reads, admin moderation, rate limits, and the optional auth design) is covered by the README §6 checklist; extra scenarios live in [../appendix/features/](../appendix/features/).

```sh
cucumber-js features/            # the core
cucumber-js --tags @security     # requirement 5: no unauthorised score increases
```
