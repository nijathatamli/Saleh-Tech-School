#!/usr/bin/env bash
# Isolated REAL PostgreSQL (Homebrew postgresql@16) cluster for QA — separate data dir, separate port, trust auth on 127.0.0.1 only.
# It never touches any other Postgres instance (e.g. the one on :5432).
#   qa/infra/pg-real.sh fresh      <dataDir> <port>
#   qa/infra/pg-real.sh rehearsal  <dataDir> <port> <exportDir>
#   qa/infra/pg-real.sh stop       <dataDir>
set -euo pipefail
export LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
PGBIN=/opt/homebrew/opt/postgresql@16/bin
MODE="$1"; DIR="$2"; PORT="${3:-5434}"; EXPORT="${4:-}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [ "$MODE" = "stop" ]; then "$PGBIN/pg_ctl" -D "$DIR" -m fast stop || true; exit 0; fi
case "$PORT" in 5432|5433) echo "refusing port $PORT"; exit 2;; esac
"$PGBIN/pg_ctl" -D "$DIR" -m immediate stop >/dev/null 2>&1 || true
rm -rf "$DIR"; mkdir -p "$DIR"
"$PGBIN/initdb" -D "$DIR" -U postgres --auth=trust -E UTF8 --locale=C >/dev/null
SOCK="$(mktemp -d /tmp/qa-pg-sock.XXXXXX)"
"$PGBIN/pg_ctl" -D "$DIR" -o "-p $PORT -c listen_addresses=127.0.0.1 -c unix_socket_directories=$SOCK -c fsync=off -c max_connections=100" -l "$DIR/server.log" -w start >/dev/null
psql() { "$PGBIN/psql" -h 127.0.0.1 -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q "$@"; }
apply_file() { psql -f "$1" >/dev/null; }
if [ "$MODE" = "fresh" ]; then
  apply_file "$ROOT/prisma/init.sql"
  for f in $(ls "$ROOT"/prisma/patches/*.sql | sort); do apply_file "$f"; done
  echo "[pg-real] fresh: init.sql + $(ls "$ROOT"/prisma/patches/*.sql | wc -l | tr -d ' ') patches on PostgreSQL $("$PGBIN/postgres" --version | awk '{print $3}')"
else
  cd "$ROOT"
  git show HEAD:prisma/init.sql > "$SOCK/init.sql"; apply_file "$SOCK/init.sql"
  for f in $(git ls-tree --name-only HEAD prisma/patches/ | sort); do git show "HEAD:$f" > "$SOCK/p.sql"; apply_file "$SOCK/p.sql"; done
  # production still has the columns the original `prisma db push` created (see qa/tests/schema-drift.test.mjs)
  psql -c 'ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "monthlyExpectedClasses" INTEGER NOT NULL DEFAULT 8; ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT; ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "receiptSubmittedAt" TIMESTAMP(3);' >/dev/null
  apply_file "$EXPORT/data.sql"
  counts() { psql -At -c "select table_name||'='||(xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1]::text from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1"; }
  counts > "$DIR/../$(basename "$DIR").before.txt"
  echo "[pg-real] rehearsal: committed schema + production export loaded"
  for f in $(ls "$ROOT"/prisma/patches/*.sql | sort); do apply_file "$f"; done
  echo "[pg-real] rehearsal: every patch applied on top of production data (pass 1)"
  for f in $(ls "$ROOT"/prisma/patches/*.sql | sort); do apply_file "$f"; done
  echo "[pg-real] rehearsal: every patch applied again (pass 2 = idempotency, the build re-applies all patches each deploy)"
  counts > "$DIR/../$(basename "$DIR").after.txt"
  B="$DIR/../$(basename "$DIR").before.txt"; A="$DIR/../$(basename "$DIR").after.txt"
  CHANGED=$(awk -F= 'NR==FNR{a[$1]=$2;next} ($1 in a)&&a[$1]!=$2{print $1": "a[$1]" -> "$2}' "$B" "$A")   # tables that existed before must keep every row
  NEW=$(awk -F= 'NR==FNR{a[$1]=1;next} !($1 in a){print $1}' "$B" "$A" | tr '\n' ' ')
  if [ -z "$CHANGED" ]; then echo "[pg-real] rehearsal: all $(wc -l < "$B" | tr -d ' ') existing tables kept every row; new tables from the patches: ${NEW:-none}"; else echo "[pg-real] ROW COUNTS CHANGED:"; echo "$CHANGED"; fi
fi
echo "[pg-real] READY postgresql://postgres@127.0.0.1:$PORT/postgres"
