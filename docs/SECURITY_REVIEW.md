# Security review — Saleh Tech School

Date 2026-10-13 · scope: the application code, its database schema and its build/deploy scripts · environment: isolated local copy
(production build, PostgreSQL 16, synthetic data) plus **offline** analysis of a copy of the production data. No request was sent to
production. This is a code-assisted, black/grey-box application review. It is **not** a formal OWASP certification, and it does not
cover hosting, DNS, e-mail or other infrastructure.

References used (versions checked on 2026-10-13): OWASP ASVS **5.0.0** (latest stable per owasp.org), OWASP Top 10:**2025**
(categories confirmed at top10.owasp.org/2025), OWASP API Security Top 10:**2023**, OWASP WSTG and Cheat Sheet Series, NIST SSDF (process level only).

## 1. System and trust boundaries

```
 Visitor ─┐                                   ┌─ public pages (content = frozen snapshot, no database)
 Candidate ─ (FIN + single-use code → own cookie) ─ /api/scholarship/*   ─┐
 Admin / Teacher / Student / Parent ─ (e-mail + password → NextAuth JWT cookie)
          │                                                                 │
   Browser ═══ HTTP(S) ═══ Next.js server: middleware → pages / REST routes / server actions ═══ Prisma ═══ PostgreSQL
                                                    │
                                                    └─ local disk: public/uploads (profile pictures)
```
Trust boundaries: browser ⇄ server (everything from the browser is untrusted, including ids and "role"), server ⇄ database
(Prisma, parameterised), the two session kinds (portal and exam) which are signed with different salts and are not interchangeable
(SCH-14). There are **no** third-party integrations: no e-mail, SMS, payment gateway or webhook, so no inbound callbacks exist.

| Threat | Vector | Control found | Result |
|---|---|---|---|
| Take over any account | Password-reset link returned to the requester | none (it was the bug) | **F-02 fixed**; link no longer exists |
| Admin takeover with a known password | Demo passwords from `seed.ts` left in production | none | **F-01 OPEN (production data)** |
| Read/change another user's data | Changed ids in URLs, bodies, server-action arguments | Ownership resolved from the session in `src/lib/access.ts`; roles checked per route | Held in every probe (RBAC-01…04, IDOR-01…14) |
| Keep using a revoked account | Old cookie | none (30-day JWT) | **F-04 fixed** |
| Guess passwords / course codes | Scripted attempts | none for passwords; throttling + 160-bit codes for the exam | **F-10 fixed**; SCH-06 |
| Cross-site request forgery | Foreign page posting to our API | SameSite=Lax cookies + Origin check on REST + Next's own action check | Held (SEC-01, RBAC-04, IDOR-14, SCH-07) |
| Stored script injection | Free text (notes, homework, names) | React escaping; exam HTML sanitised (`rich-text.ts`) | Held (PRIV-03, WF-E3) |
| Malicious upload | Spoofed MIME type, HEIC/AVIF decoder bugs | MIME only (weak) | **F-13 fixed** |
| Tracking / SSRF-ish via images | Arbitrary avatar URL, optimizer remote pattern | none | **F-12 fixed**, optimizer restricted |
| Double booking / over-capacity / double billing | Simultaneous requests | transactions, unique keys; locking was missing | **F-07 fixed**, RACE-01…07 |
| Flooding the staff | Public trial-lesson form | none | **F-11 fixed** |
| Known framework vulnerabilities | Outdated Next.js | — | **F-03 OPEN**, mitigated |

## 2. Authentication and session assessment (ASVS V6/V7)

| Control | State |
|---|---|
| Passwords | bcrypt (cost 10) via `bcryptjs`; minimum 8 characters on every path since this audit (the public reset used 6); no composition rules; no breach-list check |
| Sign-in | Case-insensitive e-mail; deactivated accounts refused; unknown e-mail costs the same time as a wrong password; throttled (5 / e-mail+address, 30 / address, 50 / e-mail per 15 min, in memory) |
| Session | NextAuth JWT in an `HttpOnly`, `SameSite=Lax` cookie (AUTH-03); default 30-day lifetime; **re-validated against the database on every request** (role and `active`), so deactivation/role change is immediate (AUTH-07/08). `Secure` + `__Secure-` prefix are applied by NextAuth only when `NEXTAUTH_URL` is HTTPS — **must be set in production** |
| Sign-out | Verified for all four roles; protected pages unreachable afterwards (UI-02) |
| Password recovery | No link/e-mail flow exists (no mail service). A request notifies the admins, who set a new password; identical response for known/unknown e-mails; token redemption path is single-use, expiring, refuses inactive accounts |
| Public registration | Closed (only the trial-lesson request is public); admin creates accounts |
| Exam candidates | FIN + single-use 32-character course code; own cookie `__Host-sts_scholarship` in production, `HttpOnly`, `SameSite=Lax`; 6 h; account row re-checked each request |
| Default credentials | **Production still contains published demo passwords (F-01)** |

## 3. Authorization — role/permission matrix (verified by tests)

R = read, C = create, U = update, D = delete/deactivate, — = no access. "own" = only rows reachable through the user's own relationships.

| Resource | Anonymous | Admin | Teacher | Student | Parent |
|---|---|---|---|---|---|
| Public site, trial-lesson request (C) | R / C | R / C | R / C | R / C | R / C |
| Users: teachers, parents, students, courses, settings | — | R C U D(deactivate) | — | — | — |
| Classes, membership, class teacher | — | R C U D(archive) | R own classes | R own classes | R own children's classes |
| Lessons | — | R C U cancel | R, C own classes, delete own **uncompleted** | R own | R children's |
| Attendance / "lesson completed" | — | R | C U own lessons (not cancelled) | R own | R children's |
| Homework, submissions, grades | — | R (audit) | C own classes; U grades of own homework | R own; U (hand in) own | R children's |
| Teacher notes | — | R (audit) | C D own; reads own students | R notes marked "student" | R notes marked "parent"/"student" |
| Payments | — | R, U status (audited) | — | R flag "payment due" (own) | R children's |
| Notifications | — | R own (+admin feed) | R own | R own | R own, U (mark read) |
| Audit log | — | R | — | — | — |
| Scholarship exam: results, FIN (decrypted), codes | — | R C | — | — | — |
| Scholarship exam: own attempt | candidate with code: C U R own | | | | |
| Profile picture | — | — | U own (own uploads only) | U own | U own |

Evidence: RBAC-01…04 drive **every** REST route (34, discovered from the source tree) with every role and method; IDOR-01…14 cover REST, **8 server actions**, pages and payload contents; WF/BILL suites cover the positive paths.

## 4. OWASP Top 10:2025 mapping

| Category | Findings and status |
|---|---|
| A01 Broken Access Control | No object-level or function-level bypass found (matrix above). Revoked sessions kept access → **F-04 fixed**. Admin pages relied on a layout → guard added |
| A02 Security Misconfiguration | Missing headers, framework banner → **F-14 fixed**; CSP missing (F-25); tracked `.env` (F-32); `NEXTAUTH_URL` must be HTTPS in production |
| A03 Software Supply Chain Failures | `npm audit`: 1 critical, 2 high in production dependencies (**F-03 open**); lockfile present; `playwright` added as a dev dependency only; seed guard prevents demo data in production tooling |
| A04 Cryptographic Failures | bcrypt for passwords; FIN stored as keyed hash + AES-256-GCM (good) but the key is derived from the session secret (**F-31**); HTTPS/HSTS depend on the host; reset tokens (no longer created) were stored in clear |
| A05 Injection | Prisma/parameterised SQL everywhere; the few raw queries use tagged templates. Hostile parameters (`' OR 1=1--`, `%00`, wildcard) tested on every list (WF-G1) → one 500 class found and fixed (F-15) |
| A06 Insecure Design | Reset link in the response (**F-02**), cancelled lesson billable (**F-06**), future lesson billable (**F-17 open**), unthrottled public form (**F-11**) |
| A07 Authentication Failures | **F-01**, **F-02**, **F-10** (all addressed except F-01); password policy unified |
| A08 Software or Data Integrity Failures | Races that corrupted counters/bookings (**F-07 fixed**); build runs SQL patches automatically (idempotent, rehearsed); upload content check (**F-13**) |
| A09 Security Logging and Alerting Failures | Business audit log is complete and clean (actor, before/after, no secrets: AUD-1); app logs contain no PII. **Gap:** failed sign-ins and lock-outs are not logged, no alerting exists |
| A10 Mishandling of Exceptional Conditions | Unhandled 500s on hostile/invalid input found and fixed (F-11, F-15, duplicate keys → 409); errors return generic messages, no stack traces (PRIV-05) |

## 5. OWASP API Security Top 10:2023 mapping

API1 BOLA — held (IDOR suite). API2 Broken Authentication — F-10/F-04 fixed. API3 Broken Object Property Level Authorization — mass-assignment of `role`, `active`, `id`, `passwordHash` ignored (IDOR-12); no hash/FIN in any response (IDOR-13). API4 Unrestricted Resource Consumption — page size capped at 100, uploads 8 MB and 30/hour, public form throttled; exam registration 200/hour/address. API5 Broken Function Level Authorization — every admin route refuses teacher/student/parent (RBAC-02). API6 Unrestricted Access to Sensitive Business Flows — trial form and sign-in throttled; payment status admin-only. API7 SSRF — no feature fetches user-supplied URLs; the image optimizer is restricted to one host/path. API8 Security Misconfiguration — headers added; no CORS headers are emitted (cross-origin reads are impossible); CSP open. API9 Improper Inventory Management — routes enumerated from source; no stale/duplicate API versions. API10 Unsafe Consumption of APIs — no upstream APIs consumed.

## 6. Dependency and configuration scan

* `npm audit --omit=dev`: **critical 1 (next), high 2 (next, postcss), moderate 0**; with dev tools: 10 (1 critical, 7 high, 2 moderate). `next` advisories (22) are fixed only from 15.5.x/16.x; the two critical ones: the Windows-only RCE does not apply to Render (Linux); the image-optimizer RCE concerns AVIF/HEIC decoding — **mitigated** by WebP-only output, one allowed remote path and no HEIC uploads. Remedy = upgrade (F-03).
* Secrets: no API keys, tokens or private keys in tracked source (pattern scan). Tracked `.env` holds only local values (F-32). The seed file contains the demo passwords by design — now blocked from remote databases.
* Cookies: see §2. CORS: no `Access-Control-Allow-*` header on any tested endpoint; `OPTIONS` answers 204 without them.
* Headers now sent: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/microphone/geolocation/payment off), `Cross-Origin-Opener-Policy: same-origin`, HSTS (effective over HTTPS). Not set: CSP.
* Upload endpoint: authenticated only; magic-byte check; random file names; stored under `public/uploads` (served statically with the extension-derived type; SVG/HTML cannot be stored).

## 7. Sensitive-data handling

| Data | Where | Protection / note |
|---|---|---|
| Passwords | `User.passwordHash` | bcrypt; never in responses or logs (IDOR-13, AUD-1) |
| FIN (national id) of exam candidates and students | `*.finHash`, `*.finEncrypted` | HMAC lookup + AES-256-GCM; decrypted only for admins; key derived from `NEXTAUTH_SECRET` (F-31) |
| Minors' names, birth dates, attendance, grades, notes | database | scoped by role (matrix); the school-wide leaderboard shows 8 names/photos to every student (F-16b) |
| Parent phone/e-mail | database | admin and the parent only |
| Backups / exports | `backups/` (gitignored), `pg_dump` files | contain all of the above — store encrypted, delete after use |
| Logs | server stdout | no e-mails, passwords or tokens found in 260+ lines of a full test run |

## 8. Logging and operational security

Audit trail (`AuditLog`): every admin mutation and every teacher/student action records actor, entity, before/after, **without** secrets. Notifications tell admins about new applications, payments due and password-help requests. Missing: failed-login and lock-out events, alerting, log retention policy.

## 9. Remediation status and residual risk

Fixed and verified: F-02, F-04, F-05, F-06, F-07, F-10…F-15, F-16a, F-19, F-21…F-24, F-27, F-28 (see `FINAL_RELEASE_AUDIT.md` §4).
Residual / open: **F-01 (Critical, production passwords)**, F-03 (framework upgrade), F-08 (ephemeral uploads), F-09 (legal pages), F-16b, F-17, F-18, F-25, F-31, F-32.

## 10. Tests not performed (and why)

Infrastructure/network scanning, TLS configuration of the real host, secrets stored in Render, DNS/e-mail security, DDoS, social engineering — out of scope and not authorized. Dynamic scanning of production — forbidden by the audit rules. Cross-browser behaviour of cookies (Chromium only). Manual exploitation attempts against the Next.js advisories — not attempted; mitigations rely on the advisory text.
