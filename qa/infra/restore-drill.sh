#!/usr/bin/env bash
# Backup → restore drill on the isolated QA cluster: dump a database with pg_dump (custom format), restore it into a NEW
# database and compare every table's row count and the number of foreign keys. Proves the dump/restore procedure documented
# in docs/PROJECT_HANDOVER.md works; it says nothing about the hosting provider's own backups.
#   qa/infra/restore-drill.sh <port> [source-db]
set -euo pipefail
export LC_ALL=en_US.UTF-8
B=/opt/homebrew/opt/postgresql@16/bin
PORT="${1:?port}"; SRC="${2:-postgres}"
case "$PORT" in 5432|5433) echo "refusing port $PORT"; exit 2;; esac
H=(-h 127.0.0.1 -p "$PORT" -U postgres)
DST="restore_check_$(date +%s)"
DUMP="$(mktemp /tmp/qa-drill.XXXXXX)"
"$B/pg_dump" "${H[@]}" -Fc -f "$DUMP" "$SRC"
echo "dump: $(wc -c < "$DUMP" | tr -d ' ') bytes"
"$B/createdb" "${H[@]}" "$DST"
"$B/pg_restore" "${H[@]}" -d "$DST" --no-owner --exit-on-error "$DUMP"
echo "restore into $DST finished without errors"
counts() {
  "$B/psql" "${H[@]}" -d "$1" -At -c "select table_name || '=' || (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I', table_name), false, true, '')))[1]::text from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1"
}
A="$(counts "$SRC")"; R="$(counts "$DST")"
if [ "$A" = "$R" ]; then echo "all $(echo "$A" | wc -l | tr -d ' ') tables identical after restore ($(echo "$A" | awk -F= '{s+=$2} END{print s}') rows)"; else echo "MISMATCH"; diff <(echo "$A") <(echo "$R"); exit 1; fi
FA="$("$B/psql" "${H[@]}" -d "$SRC" -At -c "select count(*) from pg_constraint where contype='f'")"
FR="$("$B/psql" "${H[@]}" -d "$DST" -At -c "select count(*) from pg_constraint where contype='f'")"
[ "$FA" = "$FR" ] && echo "foreign keys: $FA in source, $FR restored" || { echo "foreign key count differs: $FA vs $FR"; exit 1; }
IA="$("$B/psql" "${H[@]}" -d "$SRC" -At -c "select count(*) from pg_indexes where schemaname='public'")"
IR="$("$B/psql" "${H[@]}" -d "$DST" -At -c "select count(*) from pg_indexes where schemaname='public'")"
[ "$IA" = "$IR" ] && echo "indexes: $IA in source, $IR restored" || { echo "index count differs: $IA vs $IR"; exit 1; }
echo "dump kept at $DUMP (delete it when finished: it contains the copied data)"
