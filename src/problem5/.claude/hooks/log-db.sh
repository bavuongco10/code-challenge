#!/usr/bin/env bash
# Audit trail: append every DB-touching agent action to .claude/db-actions.log (one JSON object per line).
input=$(cat)
tool=$(jq -r '.tool_name' <<<"$input")
cmd=$(jq -r '.tool_input.command // empty' <<<"$input")
if [[ "$tool" != mcp__*neon* ]]; then
  # DB clients/migrations, or API writes (curl/fetch with POST/PATCH/PUT/DELETE)
  grep -Eq '\b(psql|pg_dump|pg_restore|drizzle-kit|db:(migrate|generate|push|studio)|neon(ctl)? )|DATABASE_URL|(curl|vercel curl).*-X *(POST|PATCH|PUT|DELETE)' <<<"$cmd" || exit 0
fi
log="$(dirname "$0")/../db-actions.log"
jq -c '{ts: (now | todate), session: .session_id, tool: .tool_name, input: .tool_input,
        exit: (.tool_response.exitCode // .tool_response.exit_code // null)}' <<<"$input" >>"$log"
exit 0
