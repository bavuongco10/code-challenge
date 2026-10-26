# Swap

## Overview

Currency swap. Users pick two tokens, enter an amount,
and see the converted amount from live prices. The backend is mocked; there is no server.
Full brief: `.problem/problem.md`.

## External data

- Prices: `https://interview.switcheo.com/prices.json`. Leave out tokens that have no price.
  TODO: document the response shape and how duplicate entries are handled once the fetch exists.
- Token icons: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/<SYMBOL>.svg`.
  Some symbols may have no icon, so render a fallback.
- Fake the swap submit with a timeout plus a loading state. Don't add a real backend.

## Rules

- TODO: amount validation (empty, zero, negative, too many decimals), same-token swap, behavior while prices load.

## Gotchas

- TODO

## History

- Original brief: `.problem/problem.md`.
