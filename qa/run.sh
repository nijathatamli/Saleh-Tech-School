#!/usr/bin/env bash
# Runs the QA suites against the QA app (default :3100) and the isolated QA database (default :5434).
# Prerequisites (see qa/README.md): npx next build; qa/infra/pg-real.sh fresh …; prisma seed; qa/infra/start-app.sh
set -uo pipefail
cd "$(dirname "$0")/.."
FILES=("$@"); [ ${#FILES[@]} -eq 0 ] && FILES=(qa/tests/*.test.mjs)
node --test --test-concurrency=1 "${FILES[@]}"
