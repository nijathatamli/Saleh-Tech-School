#!/usr/bin/env bash
# Stops the QA app, rebuilds the production bundle and starts it again against the QA database.
set -euo pipefail
cd "$(dirname "$0")/../.."
export NEXT_DIST_DIR=.next-qa   # separate from `next dev`'s .next
pkill -f "next start -p ${1:-3100}" || true
npx next build > "${QA_LOG_DIR:-/tmp}/qa-build.log" 2>&1 || { tail -30 "${QA_LOG_DIR:-/tmp}/qa-build.log"; exit 1; }
(nohup qa/infra/start-app.sh "${1:-3100}" "${2:-5434}" > "${QA_LOG_DIR:-/tmp}/qa-app.log" 2>&1 &)
for i in $(seq 1 40); do curl -s -o /dev/null "http://127.0.0.1:${1:-3100}/giris" && break; sleep 0.5; done
echo "rebuilt and running on :${1:-3100}"
