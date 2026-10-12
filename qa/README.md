# QA suite

Repeatable evidence for the release audit (`docs/FINAL_RELEASE_AUDIT.md`). Everything runs against an **isolated** environment
that `qa:up` builds from scratch: a real PostgreSQL 16 cluster in `./.qa`, the production build (`next build` + `next start`) and
synthetic data. It refuses to talk to the dev database (`:5433`), to another Postgres on `:5432`, or to any remote host.

## Requirements
Node 20+ (tested on 26), Homebrew `postgresql@16`, the Playwright Chromium build (`npx playwright install chromium`, once).

## Run
```bash
npm run qa:up        # database + seed + `npm run build` + app on http://127.0.0.1:3100   (a few minutes the first time)
npm run qa:test      # ~130 API / integration / security / concurrency tests (node:test, no extra dependencies)
npm run qa:ui        # 13 browser workflows (Playwright): sign-in/out, wizard, attendance, homework, class creation, keyboard, mobile menu
npm run qa:ui:smoke  # every route of every panel, desktop + phone: HTTP status, console errors, broken images, overflow, labels
npm run qa:ui:clicks # clicks EVERY interactive element on a fresh page load and records the effect (writes .qa/clicks.json)
npm run qa:perf      # latency/concurrency measurement + lab Web Vitals
npm run qa:down
```

| Folder | What it holds |
|---|---|
| `tests/*.test.mjs` | `auth-security` (sessions, deactivation, throttling, password reset, headers, uploads), `rbac-idor` (every REST route × every role, object-level access in REST, server actions and pages), `workflows` (class → teacher/student/parent, attendance, homework/grades, admissions), `billing` (8-lesson payment rule, boundaries, retries, races), `admin-crud`, `privacy-input`, `scholarship` (public exam), `concurrency` (real races, needs a real pool), `schema-drift` (schema.prisma ⇄ init.sql + patches), `ops` |
| `ui/` | Playwright: `flows.test.mjs`, `smoke.mjs`, `clicks.mjs`, `diagnose-a11y.mjs`, `dump.mjs` |
| `perf/` | `load.mjs`, `vitals.mjs`, `queries.mjs` (SQL statements per request from the Postgres log) |
| `infra/` | `up.sh`, `down.sh`, `pg-real.sh` (fresh install **or** a rehearsal of the deploy on a copy of production data), `start-app.sh`, `rebuild.sh`, `restore-drill.sh` (dump → restore → compare) |

Server actions are called over real HTTP: their ids are recovered from the production build (`tests/helpers.mjs → actionId`),
so run `qa:up` (or `npx next build`) before `qa:test`.

## Rehearsing a deploy on production data
```bash
qa/infra/pg-real.sh rehearsal "$PWD/.qa/rehearsal" 5435 backups/<export-dir>   # committed schema + the data export, then every patch twice
QA_DB_PORT=5435 ... qa/infra/start-app.sh 3101 5435                             # the app on that copy
QA_BASE_URL=http://127.0.0.1:3101 QA_DATABASE_URL=postgresql://postgres@127.0.0.1:5435/postgres npm run qa:test
```
