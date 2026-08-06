#!/bin/bash
# Loads artifacts/spring-api/.env (if present) then starts Spring Boot.
# Used by `pnpm run dev` so local developers don't have to export env vars manually.
set -e

cd "$(dirname "$0")/artifacts/spring-api"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=${SPRING_API_PORT:-8099}"
