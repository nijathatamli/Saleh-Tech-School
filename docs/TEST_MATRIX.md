# Test matrix

Evidence for `docs/FINAL_RELEASE_AUDIT.md`. Everything below was executed on 2026-10-13 against the isolated QA environment (`npm run qa:up`):
production build, PostgreSQL 16, synthetic data, Chromium. **Status values**: PASS = executed and behaved as expected; FAIL; BLOCKED = could not be executed;
NOT VERIFIED = not executed; OPEN = executed, behaviour differs from the recommended rule and a product decision is needed.
Totals (final run): API/integration **148** (147 PASS, 1 OPEN), browser workflows **32** (32 PASS), page smoke **106** page loads (0 problems),
interactive elements **2,797** (2,694 PASS, 67 SKIPPED, 36 BLOCKED, 0 FAIL), schema-drift **7** (inside the 135).

## 1. Feature inventory and traceability

"Chain" = UI action → request → server-side authorization/validation → business logic → database → response → UI → persistence → other panels.
A feature is PASS only when the chain was exercised; where a link could not be, it is stated.

### Public site
| Feature | Route(s) | Chain | Tests | Status |
|---|---|---|---|---|
| Landing page, course catalogue and detail, teachers (content = frozen snapshot, no database) | `/`, `/kurslar`, `/kurslar/[slug]`, `/muellimler`, `/muellimler/[id]` | static content → render | smoke (all), UI-05, PRIV-06 | PASS |
| Trial-lesson request wizard | `/sinaq-dersi` | 5 steps → server action `createTrialBooking` → validation/throttle → `TrialBooking` + admin notification → admin list | WF-E1…E5, UI-04, UI-05 | PASS |
| Sign in / sign out | `/giris` | form → NextAuth → JWT cookie → panel | AUTH-01…05, UI-01, UI-02, UI-03 | PASS |
| Password help | `/sifre-unutdum`, `/sifre-yenile/[token]` | request → admin notification (no link) ; token redemption path | AUTH-10…13 | PASS (no e-mail delivery exists — F-30) |
| Public sign-up | `/qeydiyyat` | redirects to the trial request | AUTH-14, UI-03 | PASS (closed on purpose) |
| Scholarship exam: info, preparation, registration, exam | `/teqaud`, `/teqaud/hazirliq`, `/teqaud/qeydiyyat`, `/teqaud/imtahan` | code + FIN → cookie → start → autosave → submit → server grading → admin results | SCH-01…15, smoke | PASS |
| Health check | `/api/health` | database ping | OPS-01 | PASS |

### Admin panel (`/admin/*`)
| Feature | Route | API / DB | Tests | Status |
|---|---|---|---|---|
| Dashboard, reports, audit log, notifications | `/admin`, `/admin/reports`, `/admin/audit`, `/admin/notifications` | read models over most tables | smoke, AUD-1, AUD-2, WF-G1 | PASS |
| Students (create, edit, search by FIN, deactivate, password) | `/admin/students[/id]` | `/api/admin/students*` → `User`, `StudentProfile` | CRUD-S1…S3, CRUD-U1/U2, IDOR-12/13 | PASS |
| Teachers | `/admin/teachers[/id]` | `/api/admin/teachers*` | CRUD-T1, T2, U1, U2 | PASS |
| Parents and parent↔child transfer | `/admin/parents[/id]` | `/api/admin/parents*`, `/api/admin/students/[id]/parent` | CRUD-P1, U1 | PASS |
| Courses | `/admin/courses` | `/api/admin/courses*` | CRUD-C1 | PASS |
| Classes, members, class teacher, archive/delete | `/admin/classes[/id]` | `/api/admin/classes*` | WF-A1…A7, RACE-01/02, UI-10 | PASS |
| Timetable | `/admin/schedule` | `/api/admin/lessons*` | WF-B1, B2, CRUD-L1, RACE-04/05/07 | PASS |
| Attendance overview (read-only) | `/admin/attendance` | `/api/admin/attendance` | smoke, WF-B3 | PASS |
| Payments (status changes) | `/admin/payments` | `/api/admin/payments*` → `Payment` | BILL-03, 07, 13, RACE-03 | PASS |
| Admissions (applications → student) | `/admin/leads` | `/api/admin/applications*` | WF-E1, E5 | PASS |
| Scholarship codes and results | `/admin/scholarship` | server action `generateScholarshipCodes`; reads | SCH-02, SCH-15 | PASS |
| School settings | `/admin/settings` | `/api/admin/settings` | CRUD-ST1 | PASS |

### Teacher, student, parent panels
| Feature | Route(s) | Chain | Tests | Status |
|---|---|---|---|---|
| Teacher: classes, rosters, calendar, add/delete lesson | `/teacher`, `/teacher/classes[/id]` | server actions / `/api/teacher/*` → `Lesson` | WF-A1, WF-B1, IDOR-01…04, UI-12 | PASS |
| Teacher: attendance and "lesson completed" | `/teacher/classes/[id]/attendance` | `saveAttendance`, REST `complete` → `Attendance` → payment cycle → notifications | WF-B3…B6, BILL-01…15, UI-07 | PASS |
| Teacher: homework, grading, notes, profile, avatar | `/teacher/homework*`, `/teacher/students/[id]`, `/teacher/profile` | `createHomework`, `saveGrades`, `createStudentNote`, `updateTeacherProfile/Avatar` | WF-D1, D2, IDOR-04, PRIV-01/03 | PASS |
| Student: schedule, progress, attendance, homework hand-in, leaderboard, avatar | `/student/*` | `submitHomework`, `updateStudentAvatar` | WF-D1/D2, IDOR-06/10, PRIV-01/02, UI-08 | PASS |
| Parent: children, attendance, homework, notifications, settings | `/parent/*` | `markAllAsRead`, `markOneAsRead`, `updateProfile`, `updateAvatar`, `updateNotificationPrefs` | IDOR-07/08/11, CRUD-P1, UI-09, UI-13 | PASS |

### Not implemented in the product (searched in the code) — so not testable
Online payment / webhooks / contracts / invoices as documents, QR attendance, CSV or PDF export, teacher salary records, e-mail/SMS, paper exam result sheets.

## 2. Interactive-element audit
2,797 elements on 53 routes × desktop/phone — full table with element, expected behaviour, implementation, result and evidence: [`INTERACTIVE_ELEMENTS.csv`](INTERACTIVE_ELEMENTS.csv). Summary: links 1,663 PASS; form fields 153 PASS (all labelled); buttons 878 PASS (clicked on a fresh load, effect + no error), 67 SKIPPED (sign-out; verified in UI-02), 36 BLOCKED (19 closed-menu close buttons, 14 position-shifting buttons — NOT VERIFIED one by one, 3 disabled by state); 0 FAIL; 0 NO-EFFECT.

## 3. Cross-panel workflows (A–G of the audit plan)
| Workflow | Where | Result |
|---|---|---|
| A class creation → enrolment → teacher/student/parent, fresh sessions, DB | WF-A1…A7, UI-10 | PASS |
| B attendance and lesson records, duplicates, corrections, failed saves | WF-B1…B6, UI-07, RACE-06 | PASS |
| C 8-lesson payment rule: 7 / 8 / 9 / 16, retries, parallel, cancel, future | BILL-01…16 | PASS; BILL-16 (future lesson) OPEN |
| D "Exams": homework grading (school) and scholarship exam (public) | WF-D1/D2, SCH-01…15 | PASS |
| E registration / admissions | WF-E1…E5, AUTH-14 | PASS |
| F payments and contracts | BILL-03/07/13, RACE-03 | PASS for manual payments; online payments/contracts N/A |
| G other: notifications, reports, settings, audit | AUD-1/2, CRUD-ST1, WF-G1 | PASS (QR, salary, exports N/A) |

## 4. Per-test table (generated from the JUnit result files by `qa/report/gen-matrix.mjs`)
Prerequisites for every API test: `npm run qa:up` (fresh database, seed, production build); each suite creates its own uniquely named synthetic teachers/parents/students/classes through the admin API; the browser tests additionally need Playwright's Chromium.

| Test ID | Layer | Role(s) | What is done and what is expected | Actual result | Status | Evidence |
|---|---|---|---|---|---|---|
| CRUD-T1 | API / integration | admin (+ every role as the affected user) | teacher lifecycle: create, read, search, update, deactivate (blocked while teaching), reactivate | as expected | PASS | `qa/tests/admin-crud.test.mjs:12` |
| CRUD-T2 | API / integration | admin (+ every role as the affected user) | teacher validation and unknown ids | as expected | PASS | `qa/tests/admin-crud.test.mjs:33` |
| CRUD-U1 | API / integration | admin (+ every role as the affected user) | teacher: the same e-mail submitted 6 times at once creates one account and answers 409, never 500 | as expected | PASS | `qa/tests/admin-crud.test.mjs:?` |
| CRUD-U1 | API / integration | admin (+ every role as the affected user) | parent: the same e-mail submitted 6 times at once creates one account and answers 409, never 500 | as expected | PASS | `qa/tests/admin-crud.test.mjs:?` |
| CRUD-U1 | API / integration | admin (+ every role as the affected user) | student: the same e-mail submitted 6 times at once creates one account and answers 409, never 500 | as expected | PASS | `qa/tests/admin-crud.test.mjs:?` |
| CRUD-U2 | API / integration | admin (+ every role as the affected user) | e-mail uniqueness ignores case and surrounding spaces, across roles | as expected | PASS | `qa/tests/admin-crud.test.mjs:58` |
| CRUD-S1 | API / integration | admin (+ every role as the affected user) | student validation: dates, grade, FIN uniqueness, parent required | as expected | PASS | `qa/tests/admin-crud.test.mjs:67` |
| CRUD-S2 | API / integration | admin (+ every role as the affected user) | deactivating a student blocks sign-in and removes them from pickers; reactivating restores both | as expected | PASS | `qa/tests/admin-crud.test.mjs:83` |
| CRUD-S3 | API / integration | admin (+ every role as the affected user) | an admin-set password takes effect at once and the old one stops working | as expected | PASS | `qa/tests/admin-crud.test.mjs:93` |
| CRUD-P1 | API / integration | admin (+ every role as the affected user) | moving a child to another parent moves access, payments and notifications with them | as expected | PASS | `qa/tests/admin-crud.test.mjs:103` |
| CRUD-C1 | API / integration | admin (+ every role as the affected user) | course lifecycle: validation, duplicate slug, deactivate hides it from new classes but keeps existing ones | as expected | PASS | `qa/tests/admin-crud.test.mjs:131` |
| CRUD-ST1 | API / integration | admin (+ every role as the affected user) | settings: validation, persistence, and the default cycle length applies to new classes only | as expected | PASS | `qa/tests/admin-crud.test.mjs:147` |
| CRUD-L1 | API / integration | admin (+ every role as the affected user) | admin lesson lifecycle: create, clash, reschedule, cancel; a completed lesson cannot be moved or cancelled | as expected | PASS | `qa/tests/admin-crud.test.mjs:162` |
| AUD-1 | API / integration | admin (+ every role as the affected user) | every admin mutation is audited with the actor, and no secret ever reaches the trail | as expected | PASS | `qa/tests/admin-crud.test.mjs:182` |
| AUD-2 | API / integration | admin (+ every role as the affected user) | admin notifications: list, mark read, and only admins can read them | as expected | PASS | `qa/tests/admin-crud.test.mjs:196` |
| AUTH-01 | API / integration | anonymous, all roles, operator | valid credentials sign in and the session carries the right role | as expected | PASS | `qa/tests/auth-security.test.mjs:18` |
| AUTH-02 | API / integration | anonymous, all roles, operator | wrong password and unknown e-mail are both rejected with no session | as expected | PASS | `qa/tests/auth-security.test.mjs:25` |
| AUTH-03 | API / integration | anonymous, all roles, operator | the session cookie is HttpOnly and SameSite=Lax | as expected | PASS | `qa/tests/auth-security.test.mjs:33` |
| AUTH-04 | API / integration | anonymous, all roles, operator | anonymous visitors are sent to /giris from every panel | as expected | PASS | `qa/tests/auth-security.test.mjs:42` |
| AUTH-05 | API / integration | anonymous, all roles, operator | a signed-in user of another role is sent away from a panel | as expected | PASS | `qa/tests/auth-security.test.mjs:51` |
| AUTH-06 | API / integration | anonymous, all roles, operator | a deactivated TEACHER cannot sign in again | as expected | PASS | `qa/tests/auth-security.test.mjs:?` |
| AUTH-07 | API / integration | anonymous, all roles, operator | a deactivated TEACHER's existing session stops working at once | as expected | PASS | `qa/tests/auth-security.test.mjs:?` |
| AUTH-06 | API / integration | anonymous, all roles, operator | a deactivated PARENT cannot sign in again | as expected | PASS | `qa/tests/auth-security.test.mjs:?` |
| AUTH-07 | API / integration | anonymous, all roles, operator | a deactivated PARENT's existing session stops working at once | as expected | PASS | `qa/tests/auth-security.test.mjs:?` |
| AUTH-06 | API / integration | anonymous, all roles, operator | a deactivated STUDENT cannot sign in again | as expected | PASS | `qa/tests/auth-security.test.mjs:?` |
| AUTH-07 | API / integration | anonymous, all roles, operator | a deactivated STUDENT's existing session stops working at once | as expected | PASS | `qa/tests/auth-security.test.mjs:?` |
| AUTH-08 | API / integration | anonymous, all roles, operator | a deactivated administrator's existing session stops working (pages and API) | as expected | PASS | `qa/tests/auth-security.test.mjs:92` |
| AUTH-09 | API / integration | anonymous, all roles, operator | repeated failed sign-ins are throttled (and a different visitor is not locked out) | as expected | PASS | `qa/tests/auth-security.test.mjs:108` |
| AUTH-10 | API / integration | anonymous, all roles, operator | password reset never returns the reset link to the requester | as expected | PASS | `qa/tests/auth-security.test.mjs:117` |
| AUTH-11 | API / integration | anonymous, all roles, operator | password reset answers identically for known and unknown e-mails | as expected | PASS | `qa/tests/auth-security.test.mjs:125` |
| AUTH-12 | API / integration | anonymous, all roles, operator | a reset token is single-use, expires, and cannot reset a deactivated account | as expected | PASS | `qa/tests/auth-security.test.mjs:132` |
| AUTH-13 | API / integration | anonymous, all roles, operator | password policy is the same on every path (>= 8 characters) | as expected | PASS | `qa/tests/auth-security.test.mjs:158` |
| AUTH-14 | API / integration | anonymous, all roles, operator | public self-registration of parent accounts is closed | as expected | PASS | `qa/tests/auth-security.test.mjs:168` |
| SEC-01 | API / integration | anonymous, all roles, operator | cross-site mutating requests to the admin API are refused | as expected | PASS | `qa/tests/auth-security.test.mjs:181` |
| SEC-02 | API / integration | anonymous, all roles, operator | baseline security headers are sent | as expected | PASS | `qa/tests/auth-security.test.mjs:189` |
| SEC-03 | API / integration | anonymous, all roles, operator | uploads require a session | as expected | PASS | `qa/tests/auth-security.test.mjs:200` |
| SEC-04 | API / integration | anonymous, all roles, operator | uploads are verified by content, not by the client-declared type | as expected | PASS | `qa/tests/auth-security.test.mjs:207` |
| SEC-05 | API / integration | anonymous, all roles, operator | a real PNG upload still works and is stored under an unguessable name | as expected | PASS | `qa/tests/auth-security.test.mjs:215` |
| OPS-01 | API / integration | anonymous, all roles, operator | the health endpoint is public, fast, and discloses nothing | as expected | PASS | `qa/tests/auth-security.test.mjs:227` |
| BILL-01 | API / integration | admin, teacher, student, parent | lessons 1-7 open no payment, the 8th opens exactly one, the 9th none (boundary) | as expected | PASS | `qa/tests/billing.test.mjs:24` |
| BILL-02 | API / integration | admin, teacher, student, parent | the cycle is per student: a classmate with no completed lessons owes nothing | as expected | PASS | `qa/tests/billing.test.mjs:44` |
| BILL-03 | API / integration | admin, teacher, student, parent | who is told, and what each panel shows | as expected | PASS | `qa/tests/billing.test.mjs:48` |
| BILL-04 | API / integration | admin, teacher, student, parent | repeating the same completion changes nothing (retry safety) | as expected | PASS | `qa/tests/billing.test.mjs:63` |
| BILL-05 | API / integration | admin, teacher, student, parent | parallel completions of the same lesson cannot double count or open two payments | as expected | PASS | `qa/tests/billing.test.mjs:72` |
| BILL-06 | API / integration | admin, teacher, student, parent | parallel completions of DIFFERENT lessons crossing the boundary together open one payment | as expected | PASS | `qa/tests/billing.test.mjs:83` |
| BILL-07 | API / integration | admin, teacher, student, parent | marking PAID closes the cycle for good; later lessons do not reopen it; money fields do not move | as expected | PASS | `qa/tests/billing.test.mjs:92` |
| BILL-08 | API / integration | admin, teacher, student, parent | a later price change never rewrites an existing payment | as expected | PASS | `qa/tests/billing.test.mjs:114` |
| BILL-09 | API / integration | admin, teacher, student, parent | correcting a mark lowers the count but never deletes or duplicates a payment | as expected | PASS | `qa/tests/billing.test.mjs:125` |
| BILL-10 | API / integration | admin, teacher, student, parent | the UI path (attendance screen) and the REST path (lesson completed) feed the same counter | as expected | PASS | `qa/tests/billing.test.mjs:135` |
| BILL-11 | API / integration | admin, teacher, student, parent | changing lessonsPerCycle mid-way opens the cycles that are due, once | as expected | PASS | `qa/tests/billing.test.mjs:143` |
| BILL-12 | API / integration | admin, teacher, student, parent | the same student in two classes is billed per class | as expected | PASS | `qa/tests/billing.test.mjs:157` |
| BILL-13 | API / integration | admin, teacher, student, parent | a payment cannot be changed by anybody but an admin | as expected | PASS | `qa/tests/billing.test.mjs:166` |
| BILL-14 | API / integration | admin, teacher, student, parent | a CANCELLED lesson cannot be marked completed (it would bill the family for a lesson that never happened) | as expected | PASS | `qa/tests/billing.test.mjs:173` |
| BILL-15 | API / integration | admin, teacher, student, parent | an attendance mark on a cancelled lesson is refused and a cancelled lesson cannot be rescheduled | as expected | PASS | `qa/tests/billing.test.mjs:184` |
| BILL-16 | API / integration | admin, teacher, student, parent | (business decision) a lesson that has not happened yet can be completed — the rule is not defined | behaviour differs from the recommended rule (see FINAL_RELEASE_AUDIT F-17) | OPEN (needs a product decision) | `qa/tests/billing.test.mjs:193` |
| RACE-01 | API / integration | admin, teacher | two admins filling the last seat of a class at the same time: the capacity holds | as expected | PASS | `qa/tests/concurrency.test.mjs:11` |
| RACE-02 | API / integration | admin, teacher | the same student added to a class 6 times at once is enrolled once | as expected | PASS | `qa/tests/concurrency.test.mjs:18` |
| RACE-03 | API / integration | admin, teacher | marking a payment PAID 6 times at once notifies the family once | as expected | PASS | `qa/tests/concurrency.test.mjs:25` |
| RACE-04 | API / integration | admin, teacher | one teacher cannot be booked into two overlapping lessons by simultaneous requests | as expected | PASS | `qa/tests/concurrency.test.mjs:34` |
| RACE-05 | API / integration | admin, teacher | the same lesson slot requested 6 times at once creates one lesson | as expected | PASS | `qa/tests/concurrency.test.mjs:44` |
| RACE-06 | API / integration | admin, teacher | 20 simultaneous completions across lessons produce exactly the right number of payment cycles | as expected | PASS | `qa/tests/concurrency.test.mjs:52` |
| RACE-07 | API / integration | admin, teacher | two different teachers requesting the same room at the same minute at once: one gets it | as expected | PASS | `qa/tests/concurrency.test.mjs:62` |
| OPS-02 | API / integration | operator | the audit tool reports accounts that use a published demo password without changing anything | as expected | PASS | `qa/tests/ops.test.mjs:17` |
| OPS-03 | API / integration | operator | --rotate gives only the selected accounts a new random password and prints it once | as expected | PASS | `qa/tests/ops.test.mjs:31` |
| OPS-04 | API / integration | operator | --deactivate locks flagged accounts instead | as expected | PASS | `qa/tests/ops.test.mjs:47` |
| OPS-05 | API / integration | operator | the seed refuses to run against a non-local database | as expected | PASS | `qa/tests/ops.test.mjs:56` |
| PRIV-01 | API / integration | student, teacher, parent, admin, visitor | profile pictures can only point at the application's own uploads (student, teacher, parent) | as expected | PASS | `qa/tests/privacy-input.test.mjs:14` |
| PRIV-02 | API / integration | student, teacher, parent, admin, visitor | the leaderboard does not show deactivated students and stays small | as expected | PASS | `qa/tests/privacy-input.test.mjs:27` |
| PRIV-03 | API / integration | student, teacher, parent, admin, visitor | free text written by one role is escaped when another role reads it | as expected | PASS | `qa/tests/privacy-input.test.mjs:36` |
| PRIV-04 | API / integration | student, teacher, parent, admin, visitor | sign-in never redirects to another site (open redirect) | as expected | PASS | `qa/tests/privacy-input.test.mjs:51` |
| PRIV-05 | API / integration | student, teacher, parent, admin, visitor | error pages do not disclose internals | as expected | PASS | `qa/tests/privacy-input.test.mjs:62` |
| PRIV-06 | API / integration | student, teacher, parent, admin, visitor | the public landing site shows nothing from the admin-managed tables | as expected | PASS | `qa/tests/privacy-input.test.mjs:75` |
| RBAC-00 | API / integration | anonymous, admin, teacher, student, parent | the route inventory is not empty and covers all three role areas | as expected | PASS | `qa/tests/rbac-idor.test.mjs:54` |
| RBAC-01 | API / integration | anonymous, admin, teacher, student, parent | anonymous callers get 401 on every role route and every method | as expected | PASS | `qa/tests/rbac-idor.test.mjs:59` |
| RBAC-02 | API / integration | anonymous, admin, teacher, student, parent | a signed-in user of the wrong role gets 403 on every role route and every method | as expected | PASS | `qa/tests/rbac-idor.test.mjs:68` |
| RBAC-03 | API / integration | anonymous, admin, teacher, student, parent | the owning role reaches its routes (nothing is blocked for everybody) and unknown ids are 404, never 500 | as expected | PASS | `qa/tests/rbac-idor.test.mjs:84` |
| RBAC-04 | API / integration | anonymous, admin, teacher, student, parent | mutating admin/teacher/student routes refuse a foreign Origin | as expected | PASS | `qa/tests/rbac-idor.test.mjs:100` |
| IDOR-01 | API / integration | anonymous, admin, teacher, student, parent | teacher B cannot read or change teacher A's class over REST | as expected | PASS | `qa/tests/rbac-idor.test.mjs:114` |
| IDOR-02 | API / integration | anonymous, admin, teacher, student, parent | teacher and student class lists contain only the caller's own classes | as expected | PASS | `qa/tests/rbac-idor.test.mjs:122` |
| IDOR-03 | API / integration | anonymous, admin, teacher, student, parent | a teacher cannot complete a lesson for a student outside that class | as expected | PASS | `qa/tests/rbac-idor.test.mjs:131` |
| IDOR-04 | API / integration | anonymous, admin, teacher, student, parent | teacher B cannot use any teacher server action on teacher A's records | as expected | PASS | `qa/tests/rbac-idor.test.mjs:140` |
| IDOR-05 | API / integration | anonymous, admin, teacher, student, parent | other roles cannot use teacher server actions at all | as expected | PASS | `qa/tests/rbac-idor.test.mjs:154` |
| IDOR-06 | API / integration | anonymous, admin, teacher, student, parent | a student cannot hand in another student's homework | as expected | PASS | `qa/tests/rbac-idor.test.mjs:162` |
| IDOR-07 | API / integration | anonymous, admin, teacher, student, parent | a parent cannot mark another user's notification as read | as expected | PASS | `qa/tests/rbac-idor.test.mjs:170` |
| IDOR-08 | API / integration | anonymous, admin, teacher, student, parent | a parent's portal never contains another family's child or class | as expected | PASS | `qa/tests/rbac-idor.test.mjs:181` |
| IDOR-09 | API / integration | anonymous, admin, teacher, student, parent | teacher pages only expose the teacher's own classes and students; foreign ids are 404 | as expected | PASS | `qa/tests/rbac-idor.test.mjs:194` |
| IDOR-10 | API / integration | anonymous, admin, teacher, student, parent | student pages never contain another student's private data (grades, notes, homework, email) | as expected | PASS | `qa/tests/rbac-idor.test.mjs:206` |
| IDOR-11 | API / integration | anonymous, admin, teacher, student, parent | the private teacher note is invisible to the student and the parent | as expected | PASS | `qa/tests/rbac-idor.test.mjs:213` |
| IDOR-12 | API / integration | anonymous, admin, teacher, student, parent | privileged fields in request bodies are ignored (no role escalation) | as expected | PASS | `qa/tests/rbac-idor.test.mjs:222` |
| IDOR-13 | API / integration | anonymous, admin, teacher, student, parent | the password hash and other secrets never appear in any admin API response | as expected | PASS | `qa/tests/rbac-idor.test.mjs:235` |
| IDOR-14 | API / integration | anonymous, admin, teacher, student, parent | a server action called with a foreign Origin is refused and changes nothing (cross-site request forgery) | as expected | PASS | `qa/tests/rbac-idor.test.mjs:246` |
| every | API / integration | — (database vs schema) | Prisma table exists | as expected | PASS | `qa/tests/schema-drift.test.mjs:25` |
| every | API / integration | — (database vs schema) | Prisma scalar field has a column | as expected | PASS | `qa/tests/schema-drift.test.mjs:25` |
| optional | API / integration | — (database vs schema) | Prisma fields are nullable, and no unknown NOT NULL column lacks a default | as expected | PASS | `qa/tests/schema-drift.test.mjs:42` |
| every | API / integration | — (database vs schema) | unique constraint / unique index declared in Prisma exists in the database | as expected | PASS | `qa/tests/schema-drift.test.mjs:25` |
| every | API / integration | — (database vs schema) | relation's foreign key column exists and is indexed or constrained | as expected | PASS | `qa/tests/schema-drift.test.mjs:25` |
| every | API / integration | — (database vs schema) | @@index declared in Prisma exists in the database (leading columns match) | as expected | PASS | `qa/tests/schema-drift.test.mjs:25` |
| no | API / integration | — (database vs schema) | foreign-key column is left without a supporting index | as expected | PASS | `qa/tests/schema-drift.test.mjs:112` |
| SCH-01 | API / integration | exam candidate (public), admin | every exam endpoint refuses callers without an exam session | as expected | PASS | `qa/tests/scholarship.test.mjs:41` |
| SCH-02 | API / integration | exam candidate (public), admin | only an administrator can mint course codes | as expected | PASS | `qa/tests/scholarship.test.mjs:50` |
| SCH-03 | API / integration | exam candidate (public), admin | registration validates every field and never reveals more than needed | as expected | PASS | `qa/tests/scholarship.test.mjs:61` |
| SCH-04 | API / integration | exam candidate (public), admin | a code works once; the same code + same FIN resumes; another FIN or another code is refused | as expected | PASS | `qa/tests/scholarship.test.mjs:73` |
| SCH-05 | API / integration | exam candidate (public), admin | two simultaneous registrations with one code: exactly one wins | as expected | PASS | `qa/tests/scholarship.test.mjs:88` |
| SCH-06 | API / integration | exam candidate (public), admin | guessing codes is throttled | as expected | PASS | `qa/tests/scholarship.test.mjs:95` |
| SCH-07 | API / integration | exam candidate (public), admin | cross-site requests are refused | as expected | PASS | `qa/tests/scholarship.test.mjs:102` |
| SCH-08 | API / integration | exam candidate (public), admin | the exam payload never contains marks; one attempt; answers validated; scored by the server | as expected | PASS | `qa/tests/scholarship.test.mjs:108` |
| SCH-09 | API / integration | exam candidate (public), admin | wrong answers score zero and still earn the minimum scholarship; unanswered counts as wrong | as expected | PASS | `qa/tests/scholarship.test.mjs:140` |
| SCH-10 | API / integration | exam candidate (public), admin | time limit: nothing is accepted after expiry + grace, and a late submit grades only what was saved | as expected | PASS | `qa/tests/scholarship.test.mjs:149` |
| SCH-11 | API / integration | exam candidate (public), admin | simultaneous autosaves of different questions are all kept; simultaneous starts make one attempt | as expected | PASS | `qa/tests/scholarship.test.mjs:165` |
| SCH-12 | API / integration | exam candidate (public), admin | images are served only to a candidate who started the exam, only for their own class, with hardening headers | as expected | PASS | `qa/tests/scholarship.test.mjs:178` |
| SCH-13 | API / integration | exam candidate (public), admin | the candidate API never exposes the FIN, its hash, the code or the result | as expected | PASS | `qa/tests/scholarship.test.mjs:193` |
| SCH-14 | API / integration | exam candidate (public), admin | an exam session is not a portal session (and the other way round) | as expected | PASS | `qa/tests/scholarship.test.mjs:204` |
| SCH-15 | API / integration | exam candidate (public), admin | results are visible to administrators in the panel and to nobody else | as expected | PASS | `qa/tests/scholarship.test.mjs:213` |
| WF-A1 | API / integration | admin, teacher, student, parent, visitor | a class created by the admin reaches teacher, students and parent — in fresh sessions, and exactly once in the database | as expected | PASS | `qa/tests/workflows.test.mjs:19` |
| WF-A2 | API / integration | admin, teacher, student, parent, visitor | adding an existing student: no duplicate account, no duplicate membership, all-or-nothing | as expected | PASS | `qa/tests/workflows.test.mjs:33` |
| WF-A3 | API / integration | admin, teacher, student, parent, visitor | removing a member removes access but keeps the account and history | as expected | PASS | `qa/tests/workflows.test.mjs:48` |
| WF-A4 | API / integration | admin, teacher, student, parent, visitor | capacity is enforced and a refused add changes nothing | as expected | PASS | `qa/tests/workflows.test.mjs:58` |
| WF-A5 | API / integration | admin, teacher, student, parent, visitor | changing the teacher moves the class between teacher panels at once | as expected | PASS | `qa/tests/workflows.test.mjs:69` |
| WF-A6 | API / integration | admin, teacher, student, parent, visitor | an archived class disappears from teachers and students; restoring brings it back | as expected | PASS | `qa/tests/workflows.test.mjs:81` |
| WF-A7 | API / integration | admin, teacher, student, parent, visitor | deleting a class with history archives it instead of destroying lessons and payments | as expected | PASS | `qa/tests/workflows.test.mjs:93` |
| WF-B1 | API / integration | admin, teacher, student, parent, visitor | lessons: same slot twice returns the existing lesson; clashes are refused; the admin timetable shows it | as expected | PASS | `qa/tests/workflows.test.mjs:107` |
| WF-B2 | API / integration | admin, teacher, student, parent, visitor | time zone: a lesson at 00:30 Baku time is stored as 20:30 UTC of the previous day and shown on the right date | as expected | PASS | `qa/tests/workflows.test.mjs:122` |
| WF-B3 | API / integration | admin, teacher, student, parent, visitor | attendance: saved once, persisted, idempotent, audited, and each panel sees the right thing | as expected | PASS | `qa/tests/workflows.test.mjs:135` |
| WF-B4 | API / integration | admin, teacher, student, parent, visitor | a mark can be corrected; the audit trail keeps the previous value; marks for non-members and junk are ignored | as expected | PASS | `qa/tests/workflows.test.mjs:162` |
| WF-B5 | API / integration | admin, teacher, student, parent, visitor | a refused attendance request leaves existing attendance untouched | as expected | PASS | `qa/tests/workflows.test.mjs:173` |
| WF-B6 | API / integration | admin, teacher, student, parent, visitor | concurrent duplicate saves cannot create duplicate attendance rows | as expected | PASS | `qa/tests/workflows.test.mjs:184` |
| WF-D1 | API / integration | admin, teacher, student, parent, visitor | homework created by a teacher appears for the assigned student and parent only | as expected | PASS | `qa/tests/workflows.test.mjs:194` |
| WF-D2 | API / integration | admin, teacher, student, parent, visitor | a student hands in, the teacher grades, the grade reaches student, parent and admin; invalid scores are refused | as expected | PASS | `qa/tests/workflows.test.mjs:207` |
| WF-E1 | API / integration | admin, teacher, student, parent, visitor | a public trial-lesson request is stored, validated and reaches the admin | as expected | PASS | `qa/tests/workflows.test.mjs:230` |
| WF-E2 | API / integration | admin, teacher, student, parent, visitor | the public form rejects bad input without a server error | as expected | PASS | `qa/tests/workflows.test.mjs:242` |
| WF-E3 | API / integration | admin, teacher, student, parent, visitor | stored markup in a request is escaped in the admin panel | as expected | PASS | `qa/tests/workflows.test.mjs:254` |
| WF-E4 | API / integration | admin, teacher, student, parent, visitor | the public form is throttled (one visitor cannot flood the admins with requests) | as expected | PASS | `qa/tests/workflows.test.mjs:259` |
| WF-E5 | API / integration | admin, teacher, student, parent, visitor | converting an application creates parent + student + membership atomically, once | as expected | PASS | `qa/tests/workflows.test.mjs:269` |
| WF-G1 | API / integration | admin, teacher, student, parent, visitor | admin list endpoints paginate, filter and survive hostile parameters | as expected | PASS | `qa/tests/workflows.test.mjs:291` |
| WF-G2 | API / integration | admin, teacher, student, parent, visitor | search returns only active students and respects the class exclusion | as expected | PASS | `qa/tests/workflows.test.mjs:304` |
| UI-01 | Browser (Playwright) | per test (browser) | the sign-in form rejects a wrong password and keeps the user on the page, for every role | as expected | PASS | `qa/ui/flows.test.mjs:33` |
| UI-02 | Browser (Playwright) | per test (browser) | sign in with the keyboard only, then sign out: the session is really gone | as expected | PASS | `qa/ui/flows.test.mjs:47` |
| UI-03 | Browser (Playwright) | per test (browser) | the 'create an account' link on the sign-in page leads to the trial-lesson request, and /qeydiyyat is closed | as expected | PASS | `qa/ui/flows.test.mjs:68` |
| UI-04 | Browser (Playwright) | per test (browser) | trial-lesson wizard: five steps by mouse, request stored and visible to the admin | as expected | PASS | `qa/ui/flows.test.mjs:77` |
| UI-05 | Browser (Playwright) | per test (browser) | the 10-year-old group is offered the cybersecurity course (course age range 10-18) | as expected | PASS | `qa/ui/flows.test.mjs:108` |
| UI-06 | Browser (Playwright) | per test (browser) | theme toggle switches the page and survives a reload | as expected | PASS | `qa/ui/flows.test.mjs:117` |
| UI-07 | Browser (Playwright) | per test (browser) | teacher marks attendance in the browser; it is stored, billed correctly and the family is told | as expected | PASS | `qa/ui/flows.test.mjs:131` |
| UI-08 | Browser (Playwright) | per test (browser) | student hands in homework in the browser; the teacher then sees it submitted | as expected | PASS | `qa/ui/flows.test.mjs:151` |
| UI-09 | Browser (Playwright) | per test (browser) | parent reads notifications and marks them all read in the browser | as expected | PASS | `qa/ui/flows.test.mjs:166` |
| UI-10 | Browser (Playwright) | per test (browser) | admin creates a class through the dialog; it appears in the list and in the teacher's panel | as expected | PASS | `qa/ui/flows.test.mjs:180` |
| UI-11 | Browser (Playwright) | per test (browser) | the mobile admin menu opens and closes; navigation works at phone width | as expected | PASS | `qa/ui/flows.test.mjs:206` |
| UI-12 | Browser (Playwright) | per test (browser) | teacher dashboard rows work from the keyboard (Tab to a student row, Enter opens it) | as expected | PASS | `qa/ui/flows.test.mjs:217` |
| UI-13 | Browser (Playwright) | per test (browser) | settings switches expose their state to assistive technology and flip when activated | as expected | PASS | `qa/ui/flows.test.mjs:230` |

| UI-14 | Browser (Playwright) | per test (browser) | parent attendance: month arrows step 12 months back, disable at the earliest, "Bu aya qayıt" returns | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-15 | Browser (Playwright) | per test (browser) | bell panel (teacher, student): opens, "Hamısını oxundu et" clears unread, Escape closes | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-16 | Browser (Playwright) | per test (browser) | admin account menu: "Ayarlar" works, no dead "Profil" | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-17 | Browser (Playwright) | per test (browser) | admin payments: "Ödəniş etdi", "Hesabı blokla", "Blokdan çıxar" | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-18 | Browser (Playwright) | per test (browser) | a lesson dated next month and marked present is reachable with the arrows (parent, student) | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-19 | Browser (Playwright) | per test (browser) | new homework with its own maximum score, scaled grading chips, feedback-only edit, "x/max" for families | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-20 | Browser (Playwright) | per test (browser) | teacher notes: visibility chips, empty note refused, delete, who can read what | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-21 | Browser (Playwright) | per test (browser) | teacher and parent profile forms: invalid refused, valid stored, cancel restores | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-22 | Browser (Playwright) | per test (browser) | admin dialogs with real data: teacher, parent, student + new parent, course; new accounts sign in; edit; deactivate/activate | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-23 | Browser (Playwright) | per test (browser) | picture upload (teacher, student, parent): real image stored and served, fake image refused | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-24 | Browser (Playwright) | per test (browser) | admin converts a trial-lesson request into student + new parent; both sign in | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-25 | Browser (Playwright) | per test (browser) | admin settings form: invalid refused, valid stored and shown after reload | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-26 | Browser (Playwright, phone widths) | admin, visitor | no sideways scroll at 320/360/390 px, header fits, payments/leads actions on screen, fields ≥16 px | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-27 | Browser (Playwright) | teacher | attendance: unsaved marks survive a background refresh, are flagged, leaving asks, empty save refused | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-29 | Browser (Playwright) | admin | glass sidebar, pill hover glides and fades, active capsule follows the page, all 15 items visible | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-30 | Browser (Playwright, desktop + touch) | admin | contrast ≥ 4.5:1, no text under 11px, visible focus, 44px touch targets, grouped nav, helpful empty states | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-31 | Browser (Playwright) | visitor | landing navbar: floating glass header, pill capsule glides/fades, current-page capsule, scholarship header, dark mode | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-32 | Browser (Playwright) | visitor | landing fox (outro-video frames): still first, then work / look up / watch / wink + ear flop in turn, types only while working, pauses off screen, still under reduce motion, fits a phone | as expected | PASS | `qa/ui/flows.test.mjs` |
| FILE-01…06 | API (HTTP) | teacher / student / parent / admin | homework files: upload rules (type from name and bytes, size, hostile names), attach in the homework transaction, who can download, unattached files private, failed attach rolls the homework back, files in audit + notice, links in the three panels | as expected | PASS | `qa/tests/homework-files.test.mjs` |
| UI-35 | Browser (Playwright) | teacher, student, parent | new-homework form: pick files, list, remove, refused type toast, limit of five, create; grading screen link downloads the file with its name; student and parent links work; phone fits | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-36 | Browser (Playwright) | visitor | landing cadet section: sits right below the hero; head scrubbed by the pointer (left pose → right pose); the looked-at course lights up and its line shows; right/left stacks run towards the middle going down; hover turns him; ring cursor, dark header; helmet on/off; card is a link to its course; reduced motion downloads no clip; phones: course row, touch scrub, no sideways scroll at 320/390 | as expected | PASS | `qa/ui/flows.test.mjs` |
| UI-37 | Browser (Playwright) | visitor | footer glass dock: real links, tooltip centred above the hovered icon, icon morph on hover, keyboard focus label, client-side navigation, dark mode, no social icon without an address, 320/390 px fit | as expected | PASS | `qa/ui/flows.test.mjs` |
| SEO-01…07 | API (HTTP) | visitor / crawler | every public page: title ≤ 60, description 80–160, one h1, canonical, Open Graph, valid JSON-LD, alt on all images; Course/FAQ/Breadcrumb data on course pages; robots.txt + sitemap.xml; portals and sign-in `noindex`; landing page visible text unchanged; home heading order | as expected | see run | `qa/tests/seo.test.mjs` |
| NOTIF-01…04 | API / integration | teacher, student | notification switches stored and honoured; attendance warning (4 lessons, <75 %, once a week, switch); mark-all-read | as expected | PASS | `qa/tests/notifications.test.mjs` |
| PBLOCK-01…04 | API / integration | admin, student, teacher, parent | block/unblock a student from a DUE payment: login stops, audit, family told, idempotent, admin only | as expected | PASS | `qa/tests/payment-block.test.mjs` |
| HARD-01…05 | API / integration | teacher, admin | impossible lesson dates, NUL byte in search, absurd filters, uploaded picture served at once | as expected | PASS | `qa/tests/input-hardening.test.mjs` |

## 5. Other measurements
| Item | Command | Result |
|---|---|---|
| Page smoke, 106 loads | `npm run qa:ui:smoke` | 0 hard problems |
| Interactive audit | `npm run qa:ui:clicks` | see §2 |
| Load, 20 concurrent | `node qa/perf/load.mjs` | 0 errors; see FINAL_RELEASE_AUDIT §7 |
| Web Vitals (lab) | `node qa/perf/vitals.mjs` | LCP ≤ 556 ms, CLS 0.000 |
| SQL per request | `node qa/perf/queries.mjs .qa/pgdata` | 6–36 statements, no N+1 |
| Deploy rehearsal on production copy | `qa/infra/pg-real.sh rehearsal …` | 30 tables intact, patches idempotent |
| Backup → restore | `qa/infra/restore-drill.sh 5435` | 31 tables / 2,187 rows / 37 FKs / 73 indexes identical |
| `npm audit --omit=dev` | | 1 critical, 2 high (F-03) |
