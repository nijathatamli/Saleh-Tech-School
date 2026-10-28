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

### Landing mascot animation
`src/components/marketing/fox-mascot.tsx` (+ `.fox-*` rules at the end of `globals.css`). The fox's moves come from the school's own outro video (`saleh-outro.mp4`): 51 frames of it, cut out of the video background, live in `public/assets/fox/fNNN.webp` (NNN = frame number of the 30 fps video, ~1.2 MB in total, loaded after the page's `load` event, skipped on "data saver" and under `prefers-reduced-motion`). The compressed files stay in memory and only the playing and the next segment are decoded (3 MB each as pictures), so at most ~27 decoded frames exist at once. The canvas is sized to what is shown (layout width × pixel density, at most the frames' 840 px) and every frame is scaled once with the browser's high-quality filter when decoded (`createImageBitmap` `resizeQuality: "high"`); drawing 840 px frames into a ~450 px box on 1× screens made edges jagged. It re-prepares the frames if the window grows well past that size. A `<canvas>` plays them in a small state machine: still → looks down → works (the speech bubble types code only now) → looks up → watches the viewer → squints, tilts, flops an ear and winks → watches → back to work. Parts: frames 0–36 work, 38–60 look up, 60–81 watch, 82–117 the wink/ear sequence. To change the animation, cut other frames the same way (flood-fill the light background from the frame edges, keep the largest component, crop x100–940 / y950–1860 of the 1080×1920 video — no resizing —, unsharp mask 1.45/−0.45, WebP quality 84 with alpha quality 92) and edit the frame lists at the top of the component. The still picture (`f060.webp`, the fox facing the viewer) is what first paints and what reduced-motion visitors see; `public/assets/fox-mascot-hero.png` is no longer used. Tested by UI-32.

### Landing: cadet section (second section, right under the hero)
`src/components/marketing/cadet-section.tsx` (server: fonts Archivo Black Italic + Urbanist, the six courses from the catalogue) → `cadet-hero.tsx` (client) + `.cd-*` rules at the end of `globals.css`. A cartoon cadet on a 1440×810 "frame" that always covers the section (`--u` units). His head is `public/assets/cadet/head.mp4`, **never played**: the pointer (or a finger) scrubs it (pointer x across the frame 14–86 % = gaze 0–1, eased; after 3.5 s of stillness the gaze drifts on its own). The six courses sit along the same gaze axis; the one he looks at lights up and its tagline replaces the subtitle; hovering/focusing a course turns him to it; cards are real links to `/kurslar/<slug>`. **Gaze per card (`gaze()` in `cadet-hero.tsx`):** left cards look left (clip position 0 → 0.2), right cards look right (0.84 → 1), the middle of the clip is "straight ahead" and highlights no course; the right stack is listed bottom-up so that the lower card of a side gets the milder pose (the clip's extreme poses look up). Clip reference: 0–0.3 looks left, 0.5 straight, 0.8–1 looks right. Red button = glass helmet (`helmet.jpg`, `mix-blend-mode: screen`). Phones (≤ 820 px): the courses become a scrolling row under the stage. Reduced motion: no clip is downloaded, no entrance animation. While the section is under the floating header, `html.cd-dark-nav` gives the header a dark glass look; `html.cd-over` swaps the fox cursor for the ring + dot. The three images/video were copied from the design brief's CDN into `public/assets/cadet/` (so the site does not depend on a third-party host). Course order/list: `ORDER` in `cadet-section.tsx`. Tested by UI-36.

### Footer glass dock
Order: the profiles (Instagram first, then LinkedIn, TikTok, and Facebook / X / GitHub when set), Bloq, and **E-poçt last** (Admin → Settings address; falls back to /elaqe). There are no home / contact / address icons by the owner's choice. `src/components/ui/glass-dock.tsx` (framer-motion tooltip + hover lift; icons of type home / blog / marker / email / linkedin / x / github collapse into a teardrop and spring back with GSAP MorphSVG, which is loaded only on the first hover) + `src/components/marketing/footer-dock.tsx` (builds the items; client side because icon components cannot be passed from the server footer) + `.glass-dock` / `.dock-ic` rules in `globals.css`. Items are real links (`<a>` / `next/link`), so they are crawlable and keyboard-focusable. The old "Bizi İzləyin" column was replaced by it. `gsap` (≥ 3.13, MorphSVG included) and `framer-motion` are dependencies. Tested by UI-37.

### Theme toggle ("glass toggle")
`src/components/marketing/theme-toggle.tsx` + `.gt-*` rules at the end of `globals.css`, same place in the navbar as the old round button. Copied from a design video: frosted pill with a coloured light inside (yellow by day, blue→violet by night), a clear glass bead (bright rim, crescents, soft shadow) that rolls end to end carrying a sun or a moon with a soft overshoot and a squash while moving, the label on the free side ("Gündüz" / "Gecə", hidden on phones), a coloured glow under the pill; light, labels and icons cross-fade with a little blur. Pure CSS keyed on `html.dark` (right on first paint); the component only flips the class, stores `theme` in localStorage and sets `aria-pressed`. Day label is dark brown (not white) for contrast on yellow. Tested by UI-42.

### Public navbar
`src/components/marketing/navbar.tsx` + `pill-nav.tsx` (floating liquid-glass header, capsule that glides behind the hovered link; styles `.pill-nav-*` at the end of `globals.css`). Tested by UI-31.

### On-page SEO (public site)
- One table, `src/lib/seo.ts` (`SEO`), holds the title tag (≤ 60), meta description (≤ 160), keywords and canonical path of every indexable page; `pageMetadata("home" | "courses" | …)` turns an entry into Next metadata (absolute title, canonical, Open Graph, Twitter card). Course and teacher pages build theirs from data (`dynamicMetadata`, `clip`). Edit the copy there only.
- Pages: `/` · `/kurslar` (+ `/kurslar/[slug]`) · `/valideyn-paneli` · `/reyler` · `/teqaud` · `/elaqe` · `/haqqimizda` · `/vakansiyalar` · `/sinaq-dersi` · `/muellimler`. `/valideyn-paneli`, `/reyler`, `/elaqe`, `/haqqimizda`, `/vakansiyalar` are new URLs. By the owner's instruction the landing page, its navbar and footer were left visually unchanged (navbar anchors, footer placeholders), so these pages are reachable only from the sitemap and in-page links until the nav/footer are allowed to link to them.
- Structured data (`src/components/seo/json-ld.tsx`): EducationalOrganization + WebSite on every page, BreadcrumbList on inner pages, ItemList on `/kurslar`, Course + FAQPage on course pages, ContactPage on `/elaqe`. No Review/AggregateRating markup on purpose (self-served reviews are not eligible).
- `src/app/sitemap.ts` (pages + every course + every teacher) and `src/app/robots.ts` (portals, sign-in, API, exam hidden). The portals and the `(auth)` pages are also `noindex` via their layouts. OG image: `public/og-image.png` (1200×630).
- **Set `NEXT_PUBLIC_SITE_URL=https://<live domain>` in production** (falls back to `NEXTAUTH_URL`); canonical URLs, sitemap and JSON-LD use it. Then submit `/sitemap.xml` in Google Search Console.
- Contact page and vacancies page show the phone / e-mail / address saved in Admin → Settings; fill them in (they also feed the structured data).
- Tests: `qa/tests/seo.test.mjs` (SEO-01…07).

### Homework files (teacher → students and parents)
- The teacher's "Yeni tapşırıq" form (desktop panel) has a **Fayl əlavə et** section: up to 5 files, 10 MB each. Each file is uploaded on its own to `POST /api/teacher/homework-files` (TEACHER only) and waits unattached; `createHomework` links the ids inside its transaction (`attachFiles` in `src/lib/homework-files.ts`: only the teacher's own, still unattached files; anything else fails the whole homework). Unattached files are swept after a day; the ✕ next to a file removes it (`DELETE …/homework-files/<id>`).
- **Storage: the file bytes are in PostgreSQL** (`HomeworkFile.data`, patch `2026-10-25-homework-files.sql`), not on disk: Render's disk is wiped on every deploy. Plan database size accordingly (a class of 10 sharing a 5 MB sheet per lesson is ~5 MB per lesson, not per student).
- Allowed: pdf, docx/doc, pptx/ppt, xlsx/xls, odt, zip, sb3 (Scratch), png/jpg/webp, txt/csv/md/py/ino/java/c/cpp/json. The type is decided from the extension AND the first bytes; html/svg/exe are refused.
- Download: `GET /api/files/homework/<id>` (signed in; admin, the class's teacher, an assigned student, that student's parent; anyone else gets 404). Always a fixed content type, `nosniff`, a sandboxing CSP and `Content-Disposition: attachment` (pictures inline).
- Shown as download chips on the teacher's grading screen and in the student's and parent's homework lists (desktop and phone). The teacher **phone** view is read-only by design (no new-homework form), so files can only be attached from the desktop/tablet panel.
- Tests: `qa/tests/homework-files.test.mjs` (FILE-01…06), UI-35.

### Admin panel design system
Reference: the "Krafts" dashboard from the design video the owner supplied (flat white cards on a cool grey canvas, blue accent, no glass, no orange). `src/components/admin/admin.css` (scoped under `.ad-root` and `html.ad-portal`; the public site, login and the other panels are untouched) holds the whole look: tokens (`--ad-*`), Plus Jakarta Sans, 10px white cards with a hairline shadow, pastel stat tiles (`.ad-tile`, `StatTile` in `bits.tsx`), a table card = grey panel with white row strips (`.ad-card:has(table)`; `.ad-flat` keeps hairline rows inside a white card), rectangular pastel status tags (`ad-badge-*`, incl. `violet`), blue primary button / grey fill secondary, plain white dialog (8px radius, grey close square), numbered pagination (`Pagination` in `bits.tsx`), charts in `charts.tsx` (blue + mint dual bars, donut, sparkline). Shell: `admin-header.tsx` = white sticky top bar (logo, **header search → /admin/students?q=**, blue **"Yarat"** menu that opens the page's create dialog through `?yarat=telebe|valideyn|muellim|kurs|sinif` (`use-open-from-query.ts`), gear → settings, bell with unread count, account menu with sign-out) + a row of text tabs (14 pages; the current one bold with a blue underline that slides; on narrow screens the row scrolls and arrows appear; counts on Ödənişlər / Müraciətlər). `app/topbar.tsx` is now only the page heading (title + muted line). The blog panel uses the same shell (`app/blogger/layout.tsx`, 4 tabs + "Yeni yazı" button). The dashboard (`app/admin/page.tsx`) shows real data: week-over-week deltas, 7-day revenue/applications chart, application-stage donut with conversion %, today's lessons, sparkline cards (`getDashboardSeries()` in `lib/admin/reports.ts`, grouped in SQL by Baku day). The pages keep their Tailwind markup; the old palette classes (`text-navy-*`, `text-electric-*`, `border-navy-*`, `bg-navy-50`, `bg-white rounded-2xl`…) are remapped in `admin.css`, so a new page gets the look by using `card`, `th`, `StatTile`, `Pagination`, `Badge`, `Button`. Accessibility rules (contrast, 44px touch targets, visible focus, minimum text size, reduced motion) are in `admin.css` and checked by UI-30; `prefers-reduced-motion` stops the transitions. The sidebar, the glass and the orange glows were removed.

### Notification banners (all panels)
`src/components/app/notification-toaster.tsx` is mounted in the layouts of admin, teacher, student and parent. It asks `GET /api/notifications/live?since=<cursor>` (`src/app/api/notifications/live/route.ts`) every 15 s while the tab is visible, and at once when the tab is shown again or the window regains focus. The answer is the signed-in user's unread notifications created after the cursor (the server's own clock, kept in `sessionStorage`), at most 5, none older than 10 minutes; without a cursor it only returns the cursor, so opening a page never replays old notifications. A new one slides in as an iOS/macOS-style frosted banner (framer-motion spring; top-right corner from the screen edge on computers, from the top on phones; swipe away, close button, auto-leaves after ~6.5 s, hovering keeps it; reduced motion = fade) and plays a chime. The chime is synthesised with Web Audio (`src/lib/notify-sound.ts`, no audio file); browsers only allow sound after the first tap/key press on the page, and the banner has a mute button (`localStorage` key `sts-notif-sound`). Tapping a banner opens `/admin/notifications` for admins (the other panels show their notifications in the bell panel on the page); a new notification also calls `router.refresh()` so counters update. Styles: `.nt-*` at the end of `globals.css`. The blogger panel has no notifications and no banner. Tested by LIVE-01…05 (API) and UI-40 / UI-40b.

### Sign-in pages (/giris, /sifre-unutdum, /sifre-yenile)
`src/app/(auth)/layout.tsx` → `src/components/auth/auth-stage.tsx` (framer-motion: dark scene, coloured orbs, floating glass tiles, code chips, frosted `.auth-card` that tilts and shows a sheen with the pointer, speech bubble) + `login-fox.tsx` (the school mascot peeking over the card; its laptop is blurred through the glass). The mascot reacts through `fox-pose.tsx` (context): watches you, **closes its eyes (frame f050) while the password field is focused**, winks (frames f082–f117) on a successful sign-in before the panel opens (~0.9 s), looks puzzled and the card shakes after a wrong password. Frames are the same cut-outs as the landing fox (`public/assets/fox`), loaded after the page's `load` event, not on data-saver, not with reduced motion. The forms keep their markup; `.auth-card` rules in `globals.css` turn their colours light-on-glass. Login form extras: show/hide password button, Caps Lock hint, button states (loading → "Daxil oldunuz"). Tested by UI-41.

## 2. Requirements
Node.js 20 or newer (the audit ran on 26.0), npm, PostgreSQL 14+ (QA used 16.14; production reports 18.6), Chromium for the browser tests
(`npx playwright install chromium`). Local development uses **PGlite** (PostgreSQL in WebAssembly) on port 5433 — no installation needed.

## 3. Environment variables (names only; never commit values)
| Variable | Required | Meaning |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string. On Render use the *internal* URL of the database in the same region; external URLs need `sslmode=require` |
| `NEXTAUTH_SECRET` | yes | 32+ random bytes (e.g. `openssl rand -base64 32`). **Also the root of the keys that encrypt/hash the exam candidates' FIN numbers** (F-31): do not change it after go-live without first planning a re-encryption, or stored FINs become unreadable |
| `NEXTAUTH_URL` | yes | The public address **with `https://`** — it switches the session cookie to `Secure` / `__Secure-` |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical origin for SEO (`https://…`, no trailing slash): canonical links, sitemap, structured data. Falls back to `NEXTAUTH_URL`. Build-time variable |
| `DATABASE_POOL_MAX` | no | Connections per server instance. Default: 5 in production, 1 in development (the dev database accepts one client at a time). Keep it below the database plan's connection limit |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM`, `_LINKEDIN`, `_TIKTOK`, `_FACEBOOK`, `_X`, `_GITHUB` | no | `https://` profile addresses (`src/lib/social.ts`). Instagram, LinkedIn and TikTok default to the school's real accounts (instagram.com/saleh.tech.school, linkedin.com/company/salehtechschool, tiktok.com/@saleh.tech.school); Facebook / X / GitHub show an icon in the footer dock only when set. The same list feeds the structured data (`sameAs`). Build-time variables: redeploy after changing |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | only for `scripts/create-admin.mjs` | creates / resets an administrator without putting the password in shell history |
| `ALLOW_REMOTE_SEED` | never in production | override that lets `prisma/seed.ts` run against a non-local database (it creates accounts with public passwords) |
| `PGLITE_PORT`, `PGLITE_HOST` | no | development database only |

## 4. Database: setup, migrations, new server
* **Fresh database**: `psql "$DATABASE_URL" -f prisma/init.sql`, then `npm run build` (it applies every `prisma/patches/*.sql` in name order, then loads the scholarship question bank, then builds). Or apply patches alone: `node scripts/db-apply-patches.mjs`.
* **Every patch must be idempotent** (`IF NOT EXISTS`, `DO $$ … EXCEPTION`), named `YYYY-MM-DD-topic.sql`; the build re-applies all of them on each deploy. After editing `schema.prisma` always add the matching patch and run `qa/tests/schema-drift.test.mjs` — it fails when the schema and the SQL files disagree (that is how a missing-column defect was found in this audit). **Do not run `prisma db push` against production.**
* Patches not yet applied to the Render database as of the 2026-10-12 export: `2026-10-04…06`, `2026-10-13-*` and `2026-10-18-homework-max-score.sql` (the last three are additive and idempotent; rehearsed on a copy of the data: all 30 tables kept every row; second run changes nothing).
* **Moving to a new database server** **[CLIENT: credentials]**
  1. Create the empty database and set `DATABASE_URL` (and keep the **same `NEXTAUTH_SECRET`**).
  2. `psql "$DATABASE_URL" -f prisma/init.sql` and `node scripts/db-apply-patches.mjs`.
  3. Restore the data: from a `pg_dump -Fc` file with `pg_restore --no-owner --exit-on-error -d <db> file.dump`, or load the `data.sql` produced by the export script inside `backups/` (data only, wrapped in one transaction).
  4. **Before or right after the move, rotate the demo passwords**: `DATABASE_URL=<new> node scripts/audit-default-passwords.mjs --rotate > new-passwords.csv` (prints the new passwords once; hand them over, then delete the file). The data you copy contains 12 accounts that use published passwords (F-01).
  5. Do **not** run `npm run db:seed` there (it refuses non-local databases).
  6. Point the app's `DATABASE_URL` at it, redeploy, check `/api/health`.
  The `backups/` folder, every dump and every `data.sql` contain children's personal data: store them encrypted, never commit them (the folder is git-ignored), delete copies you no longer need.

## 5. Build, run, deploy
* Local: see `README.md`. The QA build goes to `.next-qa` (env `NEXT_DIST_DIR`), so it can run beside `next dev` without touching its `.next`. Production build: `npm run build` → `npm start` (listens on `$PORT`).
* Render **[CLIENT: account access]** — Build command `npm install && npm run build`, start command `npm start`, health-check path `/api/health`, one instance (rate limiting is in memory), `NODE_VERSION` ≥ 20. Pull-request previews should use a *separate* database.
* **Uploads** are written to `public/uploads` on the instance's disk and served by `/api/uploads/[name]` (rewritten from `/uploads/<name>`; a production `next start` would otherwise 404 files added after boot). Render's disk is ephemeral: attach a persistent disk mounted there, or move uploads to object storage, otherwise profile pictures vanish at every deploy (F-08).
* Rollback: redeploy the previous commit. All patches are additive and idempotent, so older code keeps working on the newer schema.
* Public content (`src/lib/public-content.json`): teachers, courses, testimonials and the three hero photos are edited **in the repository** (`public/parents`, `public/students`, `public/teachers`). To rebuild the file from a database export: `npm run snapshot:public -- <folder-with-table-json>` — it would overwrite hand-added testimonials, so diff first. The landing page also loads some decorative images from `storage.googleapis.com/uxpilot-auth.appspot.com`, a bucket the school does not control (copy them into `public/` if they matter long-term).

## 6. Day-to-day administration (admin panel)
* Reset someone's password: the person's page → edit → new password (the "forgot password" form only notifies the admins). Create the first administrator: `ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/create-admin.mjs`.
* Accounts are deactivated, not deleted; a deactivated user's open sessions stop at once. A teacher with active classes cannot be deactivated; classes with lessons or payments are archived, not deleted.
* Payments: the system opens a payment automatically when a student has completed 8 lessons in a class (the number is a school setting, per class). The admin marks it PAID/CANCELLED; every change is audited.
* New families arrive through the free trial-lesson form → *Qəbul / Müraciətlər* → convert into student + parent (+ class) in one step. Exam candidates need a single-use code generated in *Təqaüd imtahanı*.

## 7. Tests and checks
`npm run qa:up` (isolated database + production build, ~25 s) → `npm run qa:test` (148 API/integration tests) → `npm run qa:ui` (32 browser flows) → `npm run qa:ui:smoke`, `npm run qa:ui:clicks`, `npm run qa:ui:clicks:deep` (also clicks inside dialogs and menus; add `--vp mobile`/`--roles x`), `npm run qa:perf`; `npm run qa:down`. Details and the production-copy rehearsal: `qa/README.md`. Run `qa:test` after every dependency or schema change.

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
