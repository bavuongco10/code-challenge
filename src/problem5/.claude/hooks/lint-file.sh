#!/usr/bin/env bash
# Auto-fix the edited file with oxlint + oxfmt; report what's left.
file=$(jq -r '.tool_input.file_path // empty')
[[ -f "$file" ]] || exit 0
cd "$(dirname "$0")/../.." || exit 0
case "$file" in */node_modules/*) exit 0 ;; esac
if [[ "$file" =~ \.(ts|js)$ ]]; then
  out=$(pnpm exec oxlint --fix "$file" 2>&1) || { echo "$out" >&2; exit 2; }
fi
pnpm exec oxfmt --no-error-on-unmatched-pattern "$file" >&2 || exit 2
exit 0
