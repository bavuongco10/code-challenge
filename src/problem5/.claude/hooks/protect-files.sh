#!/usr/bin/env bash
# Block edits to generated/sensitive files. Exit 2 = blocked; stderr goes to Claude.
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  *.env.example) exit 0 ;;
  *.env|*.env.*|*/pnpm-lock.yaml|*/node_modules/*|*/drizzle/*)
    echo "Blocked: $file is protected. Ask the user if this edit is really needed." >&2
    exit 2 ;;
esac
exit 0
