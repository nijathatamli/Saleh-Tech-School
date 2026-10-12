#!/usr/bin/env bash
# Builds the whole isolated QA environment from scratch and starts it:
#   1. a real PostgreSQL cluster in ./.qa/pgdata on :5434 (init.sql + every patch)
#   2. demo seed data (prisma/seed.ts — local databases only)
#   3. `npm run build` against that database: the real deploy script (patches → scholarship sync → next build)
#   4. the production server (`next start`) on :3100
# Needs Homebrew postgresql@16. Nothing here touches the dev database (.pgdata/:5433), another Postgres on :5432, or any remote database.
set -euo pipefail
cd "$(dirname "$0")/../.."
mkdir -p .qa
DBPORT="${QA_DB_PORT:-5434}"; APPPORT="${QA_APP_PORT:-3100}"
bash qa/infra/down.sh >/dev/null 2>&1 || true
bash qa/infra/pg-real.sh fresh "$PWD/.qa/pgdata" "$DBPORT" | grep -v NOTICE
export DATABASE_URL="postgresql://postgres@127.0.0.1:${DBPORT}/postgres?sslmode=disable"
npx tsx prisma/seed.ts
npm run build > .qa/build.log 2>&1 || { tail -40 .qa/build.log; exit 1; }
echo "build ok"
(nohup qa/infra/start-app.sh "$APPPORT" "$DBPORT" > .qa/app.log 2>&1 &)
for _ in $(seq 1 60); do curl -fs "http://127.0.0.1:${APPPORT}/api/health" >/dev/null 2>&1 && break; sleep 0.5; done
curl -fs "http://127.0.0.1:${APPPORT}/api/health" && echo && echo "QA environment ready: http://127.0.0.1:${APPPORT} (database :${DBPORT})"
