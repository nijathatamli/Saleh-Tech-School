# Saleh Tech School

Public website, scholarship exam and four signed-in panels (admin, teacher, student, parent) for Saleh Tech School.
Next.js 14 (App Router) · TypeScript · Prisma 5 + PostgreSQL · NextAuth (credentials, JWT sessions) · Tailwind.

| Area | URL | Who |
|---|---|---|
| Public site | `/`, `/kurslar`, `/muellimler`, `/sinaq-dersi` | everybody |
| Scholarship exam | `/teqaud/*` | candidates with a single-use course code |
| Admin | `/admin/*` | role `ADMIN` |
| Teacher / Student / Parent | `/teacher`, `/student`, `/parent` | their own role |
| Sign in / password help | `/giris`, `/sifre-unutdum` | everybody |

**Start here:** [`docs/PROJECT_HANDOVER.md`](docs/PROJECT_HANDOVER.md) (install, run, deploy, backup, troubleshooting) ·
[`docs/FINAL_RELEASE_AUDIT.md`](docs/FINAL_RELEASE_AUDIT.md) (what was tested, what was fixed, what is still open) ·
[`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md) · [`docs/TEST_MATRIX.md`](docs/TEST_MATRIX.md) · [`qa/README.md`](qa/README.md) (the repeatable test suite).

## Quick start (local development)
```bash
npm install
cp .env.example .env              # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
node scripts/db-push.mjs          # creates the schema (prisma/init.sql) in .pgdata — run it while the DB server is NOT running
npm run db:server                 # local PGlite database on :5433 (leave running, new terminal)
node scripts/db-apply-patches.mjs # prisma/patches/*.sql
npm run db:seed                   # demo data and demo logins — local databases only (refuses remote ones)
npm run dev
```
Production build: `npm run build` (applies `prisma/patches/*.sql`, loads the scholarship question bank, then `next build`) and `npm start`.
Health check for the host: `GET /api/health`.

## Tests
`npm run qa:up && npm run qa:test && npm run qa:ui` — see [`qa/README.md`](qa/README.md).
