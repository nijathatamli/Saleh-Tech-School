#!/usr/bin/env bash
# Stops the QA app and the QA PostgreSQL cluster (data stays in ./.qa until you delete the folder).
cd "$(dirname "$0")/../.."
pkill -f "next start -p ${QA_APP_PORT:-3100}" 2>/dev/null || true
export LC_ALL=en_US.UTF-8
[ -d .qa/pgdata ] && /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D "$PWD/.qa/pgdata" -m fast stop >/dev/null 2>&1 || true
echo "QA environment stopped"
