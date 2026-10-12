# Project handover — Saleh Tech School

Steps that need credentials, infrastructure access or a decision from the client are marked **[CLIENT]**. Nothing here assumes
a hosting capability that is not documented in the repository (there is no `render.yaml`; where Render is mentioned it is because the
scripts and the production export show that is where the application and database run today).

## 1. What this is
One Next.js 14 application (App Router, TypeScript, Tailwind) with PostgreSQL via Prisma 5 and NextAuth 4 (credentials, JWT cookie).
Public website · scholarship exam (`/teqaud`) · admin, teacher, student and parent panels. The landing pages show a **frozen content
snapshot** (`src/lib/public-content.json`) so nothing edited in the admin panel appears on the public site. Layout of the repository:

| Path | Contents |
|---|---|
| `src/app` | pages, REST routes (`api/admin|teacher|student|scholarship|uploads|health`), server actions next to the dashboards |
| `src/lib` | business rules: `access.ts` (authorization), `billing.ts` (8-lesson payment cycles), `schedule.ts` (timetable + clash rules), `admin/*`, `scholarship/*`, `rate-limit.ts`, `auth.ts` |
| `src/features/{teacher,student,parent}-dashboard` | the approved dashboard designs: `template.html` → `template.generated.tsx` (run `node scripts/dc-template-to-tsx.mjs` after editing a template) |
| `prisma/init.sql`, `prisma/patches/*.sql`, `prisma/schema.prisma`, `prisma/seed.ts` | database definition (see §4) |
| `scripts/` | `db-apply-patches.mjs`, `scholarship-sync.mjs`, `create-admin.mjs`, `audit-default-passwords.mjs`, `snapshot-public-content.mjs`, `pg-dev-server.mjs` |
| `qa/` | the repeatable test suite (`qa/README.md`) |
| `docs/` | this document, the audit, the security review, the test matrix |

## 2. Requirements
Node.js 20 or newer (the audit ran on 26.0), npm, PostgreSQL 14+ (QA used 16.14; production reports 18.6), Chromium for the browser tests
(`npx playwright install chromium`). Local development uses **PGlite** (PostgreSQL in WebAssembly) on port 5433 — no installation needed.

## 3. Environment variables (names only; never commit values)
| Variable | Required | Meaning |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string. On Render use the *internal* URL of the database in the same region; external URLs need `sslmode=require` |
| `NEXTAUTH_SECRET` | yes | 32+ random bytes (e.g. `openssl rand -base64 32`). **Also the root of the keys that encrypt/hash the exam candidates' FIN numbers** (F-31): do not change it after go-live without first planning a re-encryption, or stored FINs become unreadable |
| `NEXTAUTH_URL` | yes | The public address **with `https://`** — it switches the session cookie to `Secure` / `__Secure-` |
| `DATABASE_POOL_MAX` | no | Connections per server instance. Default: 5 in production, 1 in development (the dev database accepts one client at a time). Keep it below the database plan's connection limit |
| `NEXT_PUBLIC_SOCIAL_FACEBOOK`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM`, `NEXT_PUBLIC_SOCIAL_LINKEDIN` | no | `https://` profile addresses; the footer shows an icon only when its URL is set. Build-time variables: redeploy after changing |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | only for `scripts/create-admin.mjs` | creates / resets an administrator without putting the password in shell history |
| `ALLOW_REMOTE_SEED` | never in production | override that lets `prisma/seed.ts` run against a non-local database (it creates accounts with public passwords) |
| `PGLITE_PORT`, `PGLITE_HOST` | no | development database only |

## 4. Database: setup, migrations, new server
* **Fresh database**: `psql "$DATABASE_URL" -f prisma/init.sql`, then `npm run build` (it applies every `prisma/patches/*.sql` in name order, then loads the scholarship question bank, then builds). Or apply patches alone: `node scripts/db-apply-patches.mjs`.
* **Every patch must be idempotent** (`IF NOT EXISTS`, `DO $$ … EXCEPTION`), named `YYYY-MM-DD-topic.sql`; the build re-applies all of them on each deploy. After editing `schema.prisma` always add the matching patch and run `qa/tests/schema-drift.test.mjs` — it fails when the schema and the SQL files disagree (that is how a missing-column defect was found in this audit). **Do not run `prisma db push` against production.**
* Patches not yet applied to the Render database as of the 2026-10-12 export: `2026-10-04…06` and `2026-10-13-*` (rehearsed on a copy of the data: all 30 tables kept every row; second run changes nothing).
* **Moving to a new database server** **[CLIENT: credentials]**
  1. Create the empty database and set `DATABASE_URL` (and keep the **same `NEXTAUTH_SECRET`**).
  2. `psql "$DATABASE_URL" -f prisma/init.sql` and `node scripts/db-apply-patches.mjs`.
  3. Restore the data: from a `pg_dump -Fc` file with `pg_restore --no-owner --exit-on-error -d <db> file.dump`, or load the `data.sql` produced by the export script inside `backups/` (data only, wrapped in one transaction).
  4. **Before or right after the move, rotate the demo passwords**: `DATABASE_URL=<new> node scripts/audit-default-passwords.mjs --rotate > new-passwords.csv` (prints the new passwords once; hand them over, then delete the file). The data you copy contains 12 accounts that use published passwords (F-01).
  5. Do **not** run `npm run db:seed` there (it refuses non-local databases).
  6. Point the app's `DATABASE_URL` at it, redeploy, check `/api/health`.
  The `backups/` folder, every dump and every `data.sql` contain children's personal data: store them encrypted, never commit them (the folder is git-ignored), delete copies you no longer need.

## 5. Build, run, deploy
* Local: see `README.md`. Production build: `npm run build` → `npm start` (listens on `$PORT`).
* Render **[CLIENT: account access]** — Build command `npm install && npm run build`, start command `npm start`, health-check path `/api/health`, one instance (rate limiting is in memory), `NODE_VERSION` ≥ 20. Pull-request previews should use a *separate* database.
* **Uploads** are written to `public/uploads` on the instance's disk. Render's disk is ephemeral: attach a persistent disk mounted there, or move uploads to object storage, otherwise profile pictures vanish at every deploy (F-08).
* Rollback: redeploy the previous commit. All patches are additive and idempotent, so older code keeps working on the newer schema.
* Public content (`src/lib/public-content.json`): teachers, courses, testimonials and the three hero photos are edited **in the repository** (`public/parents`, `public/students`, `public/teachers`). To rebuild the file from a database export: `npm run snapshot:public -- <folder-with-table-json>` — it would overwrite hand-added testimonials, so diff first. The landing page also loads some decorative images from `storage.googleapis.com/uxpilot-auth.appspot.com`, a bucket the school does not control (copy them into `public/` if they matter long-term).

## 6. Day-to-day administration (admin panel)
* Reset someone's password: the person's page → edit → new password (the "forgot password" form only notifies the admins). Create the first administrator: `ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/create-admin.mjs`.
* Accounts are deactivated, not deleted; a deactivated user's open sessions stop at once. A teacher with active classes cannot be deactivated; classes with lessons or payments are archived, not deleted.
* Payments: the system opens a payment automatically when a student has completed 8 lessons in a class (the number is a school setting, per class). The admin marks it PAID/CANCELLED; every change is audited.
* New families arrive through the free trial-lesson form → *Qəbul / Müraciətlər* → convert into student + parent (+ class) in one step. Exam candidates need a single-use code generated in *Təqaüd imtahanı*.

## 7. Tests and checks
`npm run qa:up` (isolated database + production build, ~25 s) → `npm run qa:test` (135 API/integration tests) → `npm run qa:ui` (13 browser flows) → `npm run qa:ui:smoke`, `npm run qa:ui:clicks`, `npm run qa:perf`; `npm run qa:down`. Details and the production-copy rehearsal: `qa/README.md`. Run `qa:test` after every dependency or schema change.

## 8. Backup and recovery
* **Provider backups**: whatever the Render database plan offers — **not verified here; [CLIENT] confirm the plan, retention and who can restore.**
* **Your own dump** (recommended before every deploy that includes a patch): `pg_dump -Fc "$DATABASE_URL" -f saleh-$(date +%F).dump`. Restore into a **new** database and compare before trusting it: `qa/infra/restore-drill.sh` does exactly this on the QA cluster (31 tables, 2,187 rows, 37 foreign keys, 73 indexes were identical after a drill on a copy of the production data).
* A restore never needs the application code; it needs the same `NEXTAUTH_SECRET` (FIN decryption) and the schema patches applied.

## 9. Health and troubleshooting
| Symptom | Cause / fix |
|---|---|
| `GET /api/health` → 503 | database unreachable or wrong `DATABASE_URL`; the log line `[health] database check failed` names the error |
| Everybody is signed out after a deploy | `NEXTAUTH_SECRET` changed |
| Admins cannot read candidates' FINs / "FIN already registered" misbehaves | `NEXTAUTH_SECRET` differs from the one used at registration (F-31) |
| Pages render in a serif font, console shows font variables missing | stale `.next` cache after switching ports/servers: stop the server, delete `.next`, start again (development only) |
| `next dev`: first visit of a route takes many minutes | known on the original developer machine (heavy first compile); production build is unaffected |
| Local dev: `ECONNRESET` in scripts | the PGlite dev database serves one client at a time — connect per query with retries |
| Profile picture missing after a deploy | ephemeral disk (F-08) |
| Port 3000 is used by another project | `.claude/launch.json` has `autoPort`; use the port the preview prints |

## 10. Known limitations and open items
See `docs/FINAL_RELEASE_AUDIT.md` §5 for the full list with owners. Highlights: production passwords (F-01, urgent), Next.js upgrade (F-03), ephemeral uploads (F-08), missing privacy policy / terms (F-09), future-dated lesson completion and the school-wide leaderboard (F-17, F-16b — product decisions), in-memory rate limiting (single instance), no CSP, no e-mail/SMS, no online payments, QR attendance, exports or salary module (not implemented).

## 11. Access and ownership to transfer **[CLIENT]**
Hosting account (web service + database), the domain/DNS, the source repository, the `NEXTAUTH_SECRET` and database credentials (store in a password manager, not in chat), the administrator accounts, the Google-hosted image bucket used by some landing images, and the social-media accounts for the footer links.

## 12. Items to agree before signing off (warranty / maintenance) **[CLIENT]**
Who applies framework security upgrades and how quickly (F-03 is the first); who monitors `/api/health` and the database plan limits; backup retention and restore tests (suggest quarterly); whether e-mail delivery, online payments, contracts or exports are in scope for a next phase; privacy policy, terms and the handling of minors' data (retention, deletion on request); response times for the open items above.
