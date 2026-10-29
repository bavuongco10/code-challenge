#!/usr/bin/env bash
# End-of-turn gate: typecheck must pass before Claude stops.
input=$(cat)
# Avoid loops: if we already blocked once this turn, let it stop.
[[ $(jq -r '.stop_hook_active // false' <<<"$input") == true ]] && exit 0
cd "$(dirname "$0")/../.." || exit 0
out=$(pnpm exec tsc 2>&1) || { echo "$out" | head -40 >&2; exit 2; }
exit 0
