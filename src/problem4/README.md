# Problem 4: sum to n (TypeScript)

| Fn | Approach | Time | Space |
|----|----------|------|-------|
| a | Gauss formula `m(m+1)/2` | O(1) | O(1) |
| b | Iterative loop | O(n) | O(1) |
| c | Divide and conquer, `T(n)=2T(n/2)+O(1)` | O(n) | O(log n) stack |

**Contract:** `n` is a safe integer with `|n| <= MAX_N = 134_217_727`. Negative `n` mirrors positive (`-3 -> -6`). Otherwise `TypeError` (not a safe integer) or `RangeError` (beyond MAX_N). `0` returns `+0`.

**MAX_N:** the largest `m` with `m(m+1)/2 <= 2^53 - 1` (so the result is a safe integer); `m(m+1)` stays below 2^54 and is even, so the division is exact.

**Tests:** from the repo root, `node --test src/problem4` (Node >= 23.6 strips types). Type-check: `npx -y -p typescript@5.6.3 tsc -p src/problem4`.
Tests compare all three against a BigInt-loop oracle and a closed-form BigInt at +-MAX_N.
