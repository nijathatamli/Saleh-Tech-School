#!/usr/bin/env bash
# Starts the PRODUCTION build (next start) against the isolated QA database. Build first: npx next build
# usage: qa/infra/start-app.sh [port] [db-port]
set -euo pipefail
PORT="${1:-3100}"; DBPORT="${2:-5434}"
export NODE_ENV=production
export DATABASE_URL="postgresql://postgres@127.0.0.1:${DBPORT}/postgres?sslmode=disable"
export NEXTAUTH_URL="http://127.0.0.1:${PORT}"
export NEXTAUTH_SECRET="qa-only-secret-not-used-anywhere-else"
exec npx next start -p "$PORT" -H 127.0.0.1
