# Final release audit — Saleh Tech School

| | |
|---|---|
| Audit date | 2026-10-13 |
| Application | `saleh-tech-school` 0.1.0 · Next.js 14.2.35 · React 18.3 · Prisma 5.22 · NextAuth 4.24 |
| Branch / commit | `main` @ `1ed008b` **plus the uncommitted working tree** (about 110 changed paths, most of them your earlier work; nothing was committed or pushed by this audit) |
| Audited environment | **Local, isolated**: production build (`next build` + `next start`) against a real PostgreSQL 16.14 cluster created for the audit, synthetic data, Chromium (Playwright 1.63). Production (Render) was **not** accessed. A copy of the production data (the export taken on 2026-10-12) was used offline for a deploy rehearsal. |
| Production database (for reference) | PostgreSQL 18.6 on Render, schema one release behind the code (patches 2026-10-04…06 not applied there yet) |

## 1. Decision

# NO-GO today — CONDITIONAL GO once conditions C1–C5 below are done

The code is in good shape: authorization is sound, the business rules hold under parallel load, and every defect that could be fixed
in code was fixed and re-tested. **The decision is NO-GO only because of one unresolved critical issue that lives in the production
data, not in the code, and that I was not allowed to change:**

> **F-01 (Critical): 12 of the 20 accounts in the production database — including an `ADMIN` — still use the demo passwords that are written
> in `prisma/seed.ts` (`admin123`, `teacher123`, `parent123`, `student123`).** Anybody who can read the repository (or just guess
> `admin@salehtech.az` / `admin123`) can sign in to the live site as administrator and read every student, parent and payment record.
> Found by checking the 2026-10-12 export offline against the stored bcrypt hashes; no login attempt was made against production.

Release gates and conditions are in §9–§10. All five conditions are operational; none needs more development.

## 2. What was done

* Mapped the real architecture (modular monolith: Next.js app + Prisma/PostgreSQL; REST routes for admin/teacher/student, server actions for the three dashboards, a separate public exam flow, a frozen content snapshot for the landing site).
* Built a repeatable, isolated QA environment (`npm run qa:up`, 25 s from nothing) and a suite of **135 API/integration tests, 13 browser workflows, a 106-page smoke audit, a 2,797-element interactive audit, load/Web-Vitals/SQL-count measurements, a schema-drift test, a production-data deploy rehearsal and a backup→restore drill** (`qa/`).
* Reproduced each defect, fixed the root cause, added a regression test and re-ran the whole suite (twice, on a 5-connection and a 10-connection pool, to catch flakiness and races).

## 3. Results at a glance

| Check | Result |
|---|---|
| API / integration / security / concurrency tests | **135 run: 134 pass, 0 fail, 1 open product decision** (BILL-16, F-17) |
| Browser workflows (Playwright, real clicks/keys, each ends with a DB check) | **13 / 13 pass** |
| Page smoke: every route of the public site and the four panels, desktop + phone | **106 page loads, 0 HTTP/JS errors, 0 broken images, 0 horizontal overflow, 0 unnamed controls, 0 unlabeled fields** |
| Interactive elements (links, buttons, switches, fields), all 53 routes × 2 viewports | **2,797 discovered → 2,694 PASS · 67 SKIPPED (logout, covered by UI-02) · 36 BLOCKED · 0 FAIL · 0 NO-EFFECT** — see §3.1 |
| Schema ⇄ database drift (columns, nullability, unique keys, FKs, indexes) | 7 / 7 pass on a database built from `init.sql` + patches |
| Deploy rehearsal on a copy of production data (committed schema + data → all patches, twice) | All 30 existing tables kept every row; new table `Setting`; patches are idempotent |
| App on the migrated production copy | 104 page loads clean; functional tests: 2 failures on the first run, both fragile test assumptions (an unordered `LIMIT 1` over old audit rows; an admin with no notifications) — fixed, all pass |
| Backup → restore drill (`pg_dump` → new DB → compare) | 31 tables / 2,187 rows / 37 FKs / 73 indexes identical |
| Dependency scan (`npm audit --omit=dev`) | 1 critical, 2 high — see F-03 |
| Load (local, 20 concurrent, 8 s each) | 0 errors on every endpoint; p95 ≤ 141 ms for all pages (§7) |

### 3.1 Interactive-element audit (counts and how to read them)

Counted per *(route, viewport)*, so a control that appears on several pages/viewports is counted each time. Full table (one row per element: role, route, element, expected behaviour, implementation, result, evidence): [`INTERACTIVE_ELEMENTS.csv`](INTERACTIVE_ELEMENTS.csv).

| Kind | PASS | SKIPPED | BLOCKED | FAIL |
|---|---|---|---|---|
| Links (1,663) | 1,663 — every internal target answers < 400, external links carry `rel=noopener`, no `#`/placeholder links | | | 0 |
| Form fields (153) | 153 — each has an accessible name | | | 0 |
| Buttons / switches / clickable rows (981) | 878 — clicked on a **fresh page load**; each produced a navigation, request, DOM change or dialog and no console/network error | 67 — sign-out buttons (sign-out is verified separately for all four roles in UI-02) | 36 — see below | 0 |

* The 36 BLOCKED: 19 are the mobile menu's *close* button while the menu is closed (not clickable by design); 14 are buttons whose position changes after earlier clicks on the same page (10 of them the payment "Ödənilib" / "Ləğv et" buttons — the action itself is proven by BILL-07/BILL-13 and by the 8 payment clicks that did run); 3 are legitimately disabled (e.g. "next" before a choice is made). **Those 14 were not individually re-executed: NOT VERIFIED one by one.**
* 31 native confirmation dialogs were observed for destructive admin actions (deactivate, remove from class, archive); the audit dismissed them, so nothing destructive ran.
* "Expected behaviour" in the CSV is derived from each control's visible label: the project has no written specification, so no acceptance criteria could be invented.

## 4. Defects found and fixed (each re-tested; "VERIFIED" = regression test passes on the final build)

Severity reflects impact in *this* product (school with minors' data), not a generic score.

| ID | Sev. | Problem | Root cause | Fix | Regression test | Status |
|---|---|---|---|---|---|---|
| F-02 | **Critical** | **Account takeover of any user, administrators included.** The "forgot password" action returned a working reset link to whoever typed an e-mail (a demo stub: "Demo rejimi — real e-poçt servisi qoşulmayıb"), and answered differently for unknown e-mails | No e-mail service; the link was shown on screen | No link is ever created or returned; identical answer for known/unknown e-mails; admins get a notification and set a new password; requests throttled. Redemption hardened: single-use (atomic), expiry, inactive accounts refused, ≥ 8 characters like every other path | AUTH-10…13 | VERIFIED |
| F-04 | High | A deactivated user (even an administrator) kept full access for up to 30 days: pages relied on a signed cookie; layouts are not re-run on client navigation | JWT role/active were never re-read | Session callback re-reads the account on every request (one lookup per request, cached); middleware honours the revoked flag; every admin page calls `adminGuard()` | AUTH-07, AUTH-08 | VERIFIED |
| F-05 | High | **A database built from `init.sql` + patches cannot run the app** (any default read of `ClassGroup`/`Payment` fails): `schema.prisma` declares 3 columns that no SQL file creates. Production only works because it was created by `db push`. A replacement Render database would have broken | Schema drift between `schema.prisma` and `init.sql` | Patch `2026-10-13-schema-drift-columns.sql` (+ `init.sql`) | `schema-drift.test.mjs` | VERIFIED |
| F-06 | High | A **cancelled lesson could be marked completed**, counting towards (and billing) the family's 8-lesson payment | `setParticipation` never checked the lesson status | Refused with 409 in the single shared function (teacher screen and REST) | BILL-14, BILL-15 | VERIFIED |
| F-07 | High (latent) | **Five real race conditions** that only exist with a real connection pool (production used a pool of 1, which hid them): duplicate "lesson completed" requests failed for the user; a teacher could be **double-booked** (6 lessons at the same minute); class capacity could be exceeded; a payment marked PAID twice notified the family twice; duplicate lessons for one slot | Check-then-insert without locking | Row locks (`FOR UPDATE`) on the enrolment, teacher, payment and class rows, an advisory lock per room; unique-key races answer 409 instead of 500; pool is now configurable (`DATABASE_POOL_MAX`, default 5 in production) | RACE-01…07, BILL-05/06, CRUD-U1, WF-B6 | VERIFIED |
| F-10 | Medium | Unlimited password guessing on the login form | No throttle | 5 failures / e-mail+address, 30 / address, 50 / e-mail per 15 min; constant-time answer for unknown users | AUTH-09 | VERIFIED |
| F-11 | Medium | Public trial-lesson form: an invalid date returned HTTP 500; no length limits; any visitor could flood every admin with notifications | No validation / throttle | Bounded, validated fields; 5 requests / address / 30 min and 3 / phone / day; errors caught | WF-E2, WF-E4 | VERIFIED |
| F-12 | Medium | Profile pictures accepted any string (`https://evil/…` loaded in other users' browsers = tracking; 5,000-character values stored) | No validation | Only the app's own `/uploads/<uuid>.<ext>` | PRIV-01 | VERIFIED |
| F-13 | Medium | Upload type was taken from the browser-declared MIME (HTML bytes labelled `image/png` were stored); HEIC accepted | No content check | Magic-byte check (PNG/JPEG/WebP), HEIC refused, 30 uploads/hour/user | SEC-04, SEC-05 | VERIFIED |
| F-14 | Medium | No security headers; `X-Powered-By` disclosed the framework | Default config | `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS, COOP; header removed. **CSP not set** (residual, §5) | SEC-02 | VERIFIED |
| F-15 | Medium | `?status=<anything>` on payments/lessons lists → HTTP 500 (and `\u0000` crashed the query) | Enum cast without whitelist | Whitelisted | WF-G1 | VERIFIED |
| F-16a | Medium | The student leaderboard listed **deactivated** students to other children | No `active` filter | Filtered | PRIV-02 | VERIFIED |
| F-19 | Medium | Public self-registration of parent accounts (`/qeydiyyat`) was still live although the site now sends visitors to the trial-lesson request | Route/action left in place | Route redirects to `/sinaq-dersi`; action removed (aligned with your earlier instruction) | AUTH-14, UI-03 | VERIFIED |
| F-21 | Low | 14 foreign keys without an index | — | Patch `2026-10-13-foreign-key-indexes.sql` + `@@index` in the schema | schema-drift | VERIFIED |
| F-22 | Low | Accessibility: unnamed bell/month buttons and switches (no `role=switch`/state), unlabeled form fields, empty focusable calendar cells, clickable `div` rows unreachable by keyboard | Generated dashboards | Fixed in the three `template.html` files (+ regenerated), one delegated Enter/Space handler | smoke, UI-12, UI-13 | VERIFIED |
| F-23 | Low | Horizontal scroll on phones on two admin detail pages | Tables not in a scroll container | Wrapped | smoke (mobile) | VERIFIED |
| F-24 | Low | Footer social icons were `href="#"` with no accessible name | Placeholders | Rendered only when real `https://` URLs are set in `NEXT_PUBLIC_SOCIAL_*` (so they are hidden until you provide them) | click audit | VERIFIED |
| F-27 | Low | No health endpoint for the host | — | `GET /api/health` (database ping, no details) | OPS-01 | VERIFIED |
| F-28 | Low | Seed script would happily create the public demo accounts in *any* database (this is how F-01 most likely arose) | No guard | Refuses non-local databases (`ALLOW_REMOTE_SEED=1` to override) | OPS-05 | VERIFIED |
| F-35 | Low | `README.md` was an empty stub; seed/backup/deploy knowledge lived only in people's heads | — | README + the documents in `docs/` + `qa/README.md` | — | DONE |

Also added without a defect behind them: `scripts/audit-default-passwords.mjs` (finds and rotates/locks accounts that use a published password, OPS-02…04).

## 5. Open items

| ID | Sev. | What | Evidence | Impact | Required next action | Owner |
|---|---|---|---|---|---|---|
| **F-01** | **Critical** | Production accounts with published demo passwords, incl. `admin@salehtech.az` (12 / 20) | Offline bcrypt check of the 2026-10-12 export | Full takeover of the live system | **C1** below. The audit tool is ready: `DATABASE_URL=… npm run audit:passwords -- --rotate` | Client / whoever holds the Render credentials (I did not and may not change production) |
| F-03 | High | **Next.js 14.2.35 has 22 published advisories fixed only in 15.5.x / 16.x** (two critical RCEs: Windows-hosted servers — *not applicable on Render/Linux*; image optimizer with AVIF/HEIC via libheif). 14.x has no patched release | `npm audit`; advisories GHSA-2xp9-vwfh-vxw4, GHSA-p293-qw3h-jr36 and others | Denial-of-service and cache advisories apply to Server Components/Actions. **Mitigated today** (WebP-only optimizer, remote images restricted to one bucket, HEIC uploads refused) but not removed | Plan the upgrade to Next ≥ 15.5.24 (or 16.3.3+): `params`/`searchParams`/`headers()`/`cookies()` become asynchronous, so it needs a migration pass and a full re-run of this suite. Two build-time advisories (`postcss`, `source-map-js`) need `npm audit fix` | Developer |
| F-08 | High | Uploaded pictures are written to `public/uploads` on the server's disk. On Render the file system is **ephemeral**: every deploy/restart deletes them (avatars would 404) | `src/app/api/uploads/route.ts` | Broken profile pictures after each deploy | Attach a Render persistent disk mounted at `public/uploads`, or move to object storage | Client + developer |
| F-09 | High (compliance) | No privacy policy or terms page although the site collects children's and parents' personal data. Footer "Məxfilik", "Şərtlər", "Haqqımızda", "Vakansiyalar", "Əlaqə" link back to `/` | click audit (links resolve but go to the home page) | Legal exposure; I cannot write the client's legal text | Provide the texts; I will add the pages | Client |
| F-17 | Medium | A lesson dated in the **future** can be marked completed and bills the family at once (BILL-16 reports it as `todo`) | BILL-16 | Teacher error or abuse opens payments early | Product decision: e.g. allow completion only from the lesson's start time | Client |
| F-16b | Medium | Every student sees the **full names and photos of the 8 top-ranked students of the whole school** (minors) | `src/lib/data.ts getLeaderboard` | Privacy of children | Product decision: show first name + initial, or only classmates | Client |
| F-18 | Medium | Rate limiting is in memory (per server instance) and keyed on the first `X-Forwarded-For` hop, which a client can set | `src/lib/rate-limit.ts` | Fine for one Render instance; weaker behind several | Keep one instance, or move counters to the database/Redis. The per-e-mail counter (50 / 15 min) still bounds distributed guessing | Developer |
| F-25 | Low | No Content-Security-Policy (the dashboards use inline styles/scripts; a nonce-based policy needs its own pass) | headers | Defence in depth missing | Dedicated CSP task | Developer |
| F-26 | Low | `npm run lint` is unusable: there is no ESLint configuration (`next lint` asks interactive questions) | repo | No lint gate in CI | Add `eslint` + `eslint-config-next` | Developer |
| F-29 | Low | Screen-reader/heading structure: `/sinaq-dersi` has no `<h1>`; the three dashboards render two `<h1>` (desktop + phone trees, one hidden) | smoke | Minor a11y | Optional | Developer |
| F-30 | Low | Notification e-mail/SMS do not exist; password help therefore depends on an admin acting on a notification | code | Operational | Connect an e-mail provider if self-service is wanted | Client |
| F-31 | Medium | The keys that encrypt candidates' FIN numbers and hash them for lookup are **derived from `NEXTAUTH_SECRET`** (`src/lib/scholarship/security.ts`). Changing the secret later makes every stored FIN unreadable in the admin panel and breaks the "FIN already registered" check | Verified: the production FINs do not decrypt with the dev secret, i.e. they are tied to production's own secret | Rotating the session secret silently destroys data access | Never rotate `NEXTAUTH_SECRET` without a plan (re-encrypt first), or introduce a separate `FIN_KEY` variable before the next rotation. Documented in `PROJECT_HANDOVER.md` | Developer |
| F-32 | Low | **`.env` is tracked by git** (despite `.gitignore`) and contains the *local* database URL and a *development* `NEXTAUTH_SECRET`. Checked offline: production uses a different secret (0 of 22 production FINs decrypt with it), so this is hygiene, not a live hole | `git ls-files .env` | Anyone who clones the repo gets that dev secret; a future copy of it into production would allow forged sessions | `git rm --cached .env` (the file stays on disk) and commit; keep `.env.example` as the template. I did not touch your git index | Developer |
| F-33 | Low | Some decorative landing images (testimonial photos, project pictures) are loaded from `storage.googleapis.com/uxpilot-auth.appspot.com`, a bucket the school does not own | `public-content.json`, `next.config.js` | If the owner removes them the images break | Copy the images into `public/` (then the optimizer exception can be removed) | Developer |

## 6. Verified working (positive evidence)

* **Authorization**: all 34 REST routes × anonymous/admin/teacher/student/parent (RBAC-01…04) — 401 for anonymous, 403 for the wrong role, owner reaches own routes; foreign `Origin` refused on every mutating route and on server actions (IDOR-14). A teacher B cannot read or change anything of teacher A over REST, **server actions** (8 actions tried) or pages (404); students cannot hand in another student's homework; a parent cannot reach another family's child (payload checked, not just the visible text); private notes never reach student/parent; no secrets (hash, FIN) in any admin API response or in the audit log.
* **Cross-panel data flow** (admin → teacher → student → parent → database), each step in a fresh session and in the database: class creation/enrolment/removal/teacher change/archive, lessons (incl. time-zone boundary 00:30 Baku), attendance (idempotent, audited, corrections keep the previous value), homework → submission → grade → notifications, application → student+parent+class in one transaction, parent ↔ child transfer with payments.
* **Payment rule**: exactly 7 → no payment, 8 → one, 9 → none, 16 → second; per student and per class; retries and 12-way parallel requests cannot double count; PAID is final and reversible only by an admin; price changes do not rewrite existing payments; mid-way cycle-length changes open the due cycle once.
* **Scholarship exam**: single-use code (3 simultaneous registrations → one wins), 32-character code throttling, marks never sent to the browser, server-side grading (verified against the database), 15-second grace/expiry, atomic autosave, images only for the candidate's own class, exam session ≠ portal session.
* **Operations**: production build in 18 s; `npm run build` (patches → question bank → next build) works against a fresh database; patches idempotent; `restore-drill` OK.

## 7. Performance and reliability observations (local measurement — not a capacity promise)

* 20 concurrent users, 8 s per endpoint, app + database + load generator on one laptop, production build: **0 errors everywhere**. Pages p95: `/admin` 90 ms, `/admin/students` 126 ms, `/admin/reports` 141 ms, teacher 55 ms, student 78 ms, parent 57 ms, public site 66–144 ms; REST lists p95 ≤ 24 ms.
* The old pool of **1 connection** made every request queue behind the previous one (`/admin/reports` p95 572 ms at 20 users, `/admin` 122 req/s). Pool 5 → 141 ms and 271 req/s. With a **remote** database each of the 8–36 SQL statements per page costs a network round trip, so the pool matters more in production than here.
* SQL statements per request: admin pages 6–18, teacher 17, parent 26, student 36; no N+1 pattern (no statement repeated more than 3×).
* Lab Web Vitals (no network throttling): LCP ≤ 556 ms, CLS 0.000, TTFB ≤ 28 ms on all 18 page/viewport combinations. **Field data and INP were not measured** (they need real users). The three dashboards download 1.0–1.5 MB on first load (icon and font files) — acceptable, worth watching on slow mobile networks.
* Failure modes exercised: duplicate/retried requests, simultaneous requests, expired sessions, deactivated accounts, hostile query parameters, malformed JSON, oversized fields, unknown ids — all answer with a clean 4xx; the application logs contain no personal data or secrets (checked).

## 8. Not tested or not applicable

| Item | Status | Reason |
|---|---|---|
| Production environment, real Render configuration (no `render.yaml` in the repo), real backups, TLS, `Secure` cookie flag over HTTPS | **NOT VERIFIED** | Not accessed by design. Local runs are HTTP; NextAuth adds the `__Secure-` cookie prefix only when `NEXTAUTH_URL` is HTTPS — set it (C3) |
| Firefox, Safari/WebKit, real phones | **NOT TESTED** | Only the cached Chromium build was available; phone widths were emulated |
| Manual screen-reader testing, colour-contrast audit, full WCAG 2.2 AA | **NOT TESTED** | Programmatic checks only (names, labels, keyboard operation, focus order of key flows) |
| Online payments, webhooks, contracts, invoices as documents, QR attendance, CSV/PDF exports, teacher salary records, e-mail/SMS | **N/A — not implemented** | Payments are recorded manually by an admin (status + audit). Searched the code to confirm |
| Traditional (paper) exam result sheets | **N/A — not implemented** | The scholarship exam is the only exam feature |
| Load beyond 20 concurrent users, soak tests, multi-instance behaviour | **NOT TESTED** | No staging environment or documented target |
| Infrastructure penetration test, DDoS, secrets in Render, DNS/e-mail security | **NOT PERFORMED** | Out of scope without authorization |
| INP and field Web Vitals | **NOT MEASURED** | Need real users |

## 9. Release gates

| Gate | Result |
|---|---|
| All critical implemented user journeys tested | PASS |
| All discovered interactive elements inventoried and accounted for | PASS (14 position-shifting buttons counted but not individually re-run — §3.1) |
| Core administrator workflows | PASS |
| Teacher permissions and workflows | PASS |
| Student data correctly scoped | PASS (leaderboard names: F-16b decision) |
| Parent–child data correctly scoped | PASS |
| Critical cross-panel workflows consistent from UI to database | PASS |
| **No known Critical/High security issue unresolved** | **FAIL — F-01 (Critical, production data); F-03 (High, framework version) mitigated but open** |
| Server-side authorization | PASS |
| Data-integrity requirements | PASS (races fixed and tested) |
| Build and automated tests | PASS |
| Deployment configuration, secrets and recovery assessed | PARTIAL — procedures documented and rehearsed locally; production itself not inspected |
| Blocked/unverified items documented | PASS (§8) |
| Handover documentation | PASS (`PROJECT_HANDOVER.md`) |

## 10. Conditions to reach CONDITIONAL GO (all operational)

* **C1 — Rotate the demo passwords in production.** `DATABASE_URL=<render url> node scripts/audit-default-passwords.mjs` (report only), then `--rotate` (prints the new passwords once) or `--deactivate`. Do it **before** the database move too: the export that would be restored into the new server contains the same accounts.
* **C2 — Deploy this version through the normal build** so patches 2026-10-04 … 2026-10-13 are applied (rehearsed OK on a production copy) and `NEXTAUTH_SECRET` is a long random value, `NEXTAUTH_URL` is the real `https://` address.
* **C3 — Decide F-08** (persistent disk or object storage for uploads) before pupils start uploading photos.
* **C4 — Supply the privacy policy and terms** (F-09), and the social-media URLs if wanted.
* **C5 — Schedule the Next.js upgrade** (F-03) and answer the two product questions F-16b and F-17.

After C1 and C2 the remaining risks are accepted-with-owner items (F-03, F-08, F-09, F-16b, F-17, F-18); that is a **CONDITIONAL GO**. A clean **GO** needs C3–C5 done.

## Appendix — files changed by this audit

*Source*: `src/lib/{auth,api,billing,schedule,data,prisma,rate-limit,avatar-url}.ts`, `src/lib/admin/{classes,payments,guard}.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts`, `src/app/(auth)/sifre-unutdum/*`, `src/app/(auth)/sifre-yenile/[token]/actions.ts`, `src/app/(marketing)/sinaq-dersi/actions.ts`, `src/app/api/{uploads,health}/route.ts`, `src/app/admin/**/page.tsx` (guard), `src/components/marketing/{footer,hero,testimonials-section}.tsx`, `src/features/{teacher,parent,student}-dashboard/{template.html,template.generated.tsx,logic.ts,vals.ts,*Dashboard.tsx,actions.ts,data.ts}`, `scripts/dc-template-to-tsx.mjs` (numeric `tabIndex`), `next.config.js`, `package.json`.
*Removed*: `src/app/(auth)/qeydiyyat/*` (public sign-up).
*Database*: `prisma/patches/2026-10-13-schema-drift-columns.sql`, `2026-10-13-foreign-key-indexes.sql`, `prisma/init.sql`, `prisma/schema.prisma` (`@@index`), `prisma/seed.ts` (guard).
*Tools*: `scripts/{audit-default-passwords,snapshot-public-content}.mjs`, everything under `qa/`, `docs/`, `README.md`.
*Earlier in this engagement (separate requests)*: landing page decoupled from the admin panel (`src/lib/public-content.json`), testimonials, footer credit, hero avatars.
