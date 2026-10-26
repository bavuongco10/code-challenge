# 0001. Record architecture decisions

- Status: Accepted
- Date: 2026-10-26

## Context

Big technical choices get forgotten or re-argued, and coding agents can't infer
the reasons behind them from the code.

## Decision

Record hard-to-reverse or contested decisions as ADRs in `docs/adr/`, following the
convention in `docs/adr/README.md`.

## Consequences

- New big decisions come with an ADR in the same change.
- Changing a decision means a new ADR that supersedes the old one, not an edit.
