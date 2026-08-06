#!/usr/bin/env bash
# Loads backend-only settings, then starts Spring Boot.
set -euo pipefail

cd "$(dirname "$0")/artifacts/spring-api"

env_file=".env"
if [[ ! -f "$env_file" ]]; then
  echo "Missing backend environment file: artifacts/spring-api/.env" >&2
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
    echo "Invalid .env entry at $env_file:$line_number (expected KEY=value)." >&2
    exit 1
  fi

  key="${line%%=*}"
  value="${line#*=}"
  if [[ "$value" =~ ^\".*\"$ || "$value" =~ ^\'.*\'$ ]]; then
    value="${value:1:-1}"
  fi

  case "$key" in
    NEXT_PUBLIC_FIREBASE_PROJECT_ID|SUPABASE_JDBC_URL|SUPABASE_DB_PASSWORD)
      printf -v "$key" '%s' "$value"
      ;;
  esac
done < "$env_file"

for variable in NEXT_PUBLIC_FIREBASE_PROJECT_ID SUPABASE_JDBC_URL SUPABASE_DB_PASSWORD; do
  if [[ -z "${!variable:-}" ]]; then
    echo "Missing required environment variable: $variable" >&2
    exit 1
  fi
done

export NEXT_PUBLIC_FIREBASE_PROJECT_ID SUPABASE_JDBC_URL SUPABASE_DB_PASSWORD
exec mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=${SPRING_API_PORT:-8099}"
