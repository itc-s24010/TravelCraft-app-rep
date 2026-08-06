#!/usr/bin/env bash

set -euo pipefail

web_port="${WEB_PORT:-3000}"
spring_api_port="${SPRING_API_PORT:-8099}"

# Next.js loads its own .env automatically. Source the backend file separately
# so database credentials are passed only to the Spring Boot process.
backend_env_file="artifacts/spring-api/.env"
if [[ ! -f "$backend_env_file" ]]; then
  echo "Missing backend environment file: $backend_env_file" >&2
  exit 1
fi

NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
SUPABASE_JDBC_URL=""
SUPABASE_DB_PASSWORD=""

line_number=0
while IFS= read -r line || [[ -n "$line" ]]; do
  ((line_number += 1))
  line="${line%$'\r'}"

  [[ -z "$line" || "${line:0:1}" == "#" ]] && continue
  if [[ "$line" != *=* ]]; then
    echo "Invalid .env entry at $backend_env_file:$line_number (expected KEY=value)." >&2
    exit 1
  fi

  key="${line%%=*}"
  value="${line#*=}"
  # Permit quoted passwords and URLs without evaluating any shell syntax.
  if [[ "$value" =~ ^\".*\"$ || "$value" =~ ^\'.*\'$ ]]; then
    value="${value:1:-1}"
  fi

  case "$key" in
    NEXT_PUBLIC_FIREBASE_PROJECT_ID|SUPABASE_JDBC_URL|SUPABASE_DB_PASSWORD)
      printf -v "$key" '%s' "$value"
      ;;
  esac
done < "$backend_env_file"

for variable in NEXT_PUBLIC_FIREBASE_PROJECT_ID SUPABASE_JDBC_URL SUPABASE_DB_PASSWORD; do
  if [[ -z "${!variable:-}" ]]; then
    echo "Missing required environment variable: $variable" >&2
    echo "Set it in $backend_env_file before running pnpm dev:all." >&2
    exit 1
  fi
done

PORT="$web_port" SPRING_API_PORT="$spring_api_port" pnpm dev &
web_pid=$!

(
  export NEXT_PUBLIC_FIREBASE_PROJECT_ID SUPABASE_JDBC_URL SUPABASE_DB_PASSWORD
  export PORT="$spring_api_port"
  cd artifacts/spring-api
  mvn spring-boot:run
) &
api_pid=$!

cleanup() {
  kill "$web_pid" "$api_pid" 2>/dev/null || true
  wait "$web_pid" "$api_pid" 2>/dev/null || true
}

trap cleanup EXIT INT TERM
wait -n "$web_pid" "$api_pid"
