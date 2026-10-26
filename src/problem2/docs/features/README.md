# Feature docs

How each feature behaves **now**: business rules, edge cases, surprises. One file per
feature with non-obvious rules (`<feature>/plan.md`, kebab-case folder). Trivial features get none.

- Document rules, not code structure. Aim for ~20–40 lines.
- Update the doc in the same change that alters a rule or edge case.
- Refactors that don't change behavior don't touch these docs.

## Template

```md
# <Feature>

## Rules

- <business rules, invariants, validation>

## Gotchas

- <surprising behavior, edge cases>

## History

- <ticket/issue links for the original spec and major changes; link, don't copy>
```
