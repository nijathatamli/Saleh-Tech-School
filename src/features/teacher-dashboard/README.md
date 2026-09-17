# Teacher dashboard (`/teacher`)

The teacher dashboard's UI is `teacher-dashboard.html` at the repo root — the
approved design, kept as the source of truth. Nothing here re-creates it: the
file's own markup, inline styles, fonts, icon font and animations are compiled
into React and driven by real data — the same pipeline as
`src/features/parent-dashboard/` and `src/features/student-dashboard/`.

## How it fits together

| Piece | What it is |
| --- | --- |
| `template.html` | The `<x-dc>` template body of `teacher-dashboard.html`, verbatim, with the prototype's demo text turned into `{{ bindings }}`, the phone-frame/status-bar/preview chrome removed, and — in the file's own style — a logout control and empty states. Form fields got `name`s; nothing else changed. |
| `scripts/dc-template-to-tsx.mjs` | Shared generator (feature table at the top): template → `template.generated.tsx` + `styles/template.generated.css`. Run `node scripts/dc-template-to-tsx.mjs teacher-dashboard` after editing the template. |
| `avatar-bases.generated.ts` | The file's avatar-circle styles, lifted out so real photos (teacher, students) can fill them. |
| `logic.ts` | Port of the file's `renderVals()` — identical style builders (`navItems`, `bar`, `seg`, `chip`, `row`, `smallBtn`, calendar cells) fed by the snapshot. `TIME_SLOTS` is the file's add-lesson time list. |
| `routes.ts` | URL ↔ screen mapping: five sections + five drill-downs, each with its own URL so back/forward/refresh work. |
| `data.ts` | `loadTeacherDashboard()` — one Prisma snapshot: classes with rosters, every student's attendance/homework/skills, all lessons and homework of the teacher's classes, unread notifications. Class tags ("CS-A") are derived from course category + group letter — never stored. |
| `actions.ts` | Server actions: create/delete lesson, save attendance (upsert per student), create homework, save grades (score + feedback → GRADED + `Grade` row), send a note to the parent, profile, avatar. Parents are notified through `parent-dashboard/notify.ts`. Also holds `updateSkillProgress`/`awardBadge` from the previous student page (no control in this design yet). |
| `TeacherDashboard.tsx` | Client component: the file's interactive state (screen, calendar month/day, add-lesson draft, attendance marks, score picks, filters, toggles, "lit" animation) + routing, logout. |
| `styles/` | `base.css` (the file's base rules + keyframes, scoped to `.td-root`), `portal.css` (neutralises the app's globals inside the dashboard; picks desktop vs mobile tree by viewport). Fonts and both icon faces are imported from the parent/student folders — not duplicated. |

Routes: `src/app/teacher/[[...slug]]/page.tsx` serves `/teacher`, `/teacher/classes`,
`/teacher/homework`, `/teacher/students`, `/teacher/profile` and the drill-downs
`/teacher/classes/[id]`, `/teacher/classes/[id]/attendance?lesson=<id>`,
`/teacher/students/[id]`, `/teacher/homework/[id]/grade`, `/teacher/homework/new`.
Access: `middleware.ts` (session + TEACHER role) and the page's own session check.

Navigation goes through `router.push` (not bare `pushState` as in the other
portals): most screens save, and `router.refresh()` only keeps the mounted
component's state when Next's tree matches the URL.

## Where the data comes from

| UI | Source |
| --- | --- |
| Header, avatar, sidebar | `TeacherProfile` + `User` (photo, name, position); "Bu həftə" = lessons Mon–Sun |
| Class cards, rosters, headcounts | `ClassGroup.enrollments[].student` — every count derived from the roster |
| Calendar cells / day lessons | `Lesson` rows of the teacher's classes, grouped by school-time date; dots also mark homework deadlines |
| Dərs əlavə et / trash | `createLesson` (class + date + time slot) / `deleteLesson` |
| Attendance marking | `saveAttendance` — upsert per student per lesson (PRESENT / LATE / ABSENT) |
| Grading queue, counts | `Submission` in SUBMITTED (handed in, awaiting a grade), grouped by homework |
| Score + feedback | `saveGrades` → `Submission.score/feedback/status=GRADED` + `Grade` row |
| New homework | `createHomework` — attached to the class's nearest lesson; PENDING submission per student |
| At-risk list | students with attendance < 75% or overdue submissions |
| Student detail skills | `SkillProgress` |
| Müəllim qeydi | `sendStudentNote` → parent notification; "Valideynə yaz" opens mail to the parent |
| Profile toggles | per-browser (localStorage) — no field for them and migrations are off |

## Open points

- The design's score buttons are 60/70/80/90/100; the old page accepted any number.
- "Maksimal bal" on the new-homework form is kept but not stored (no field on `Homework`; `Grade.maxScore` stays 100).
- Skills and badges can no longer be set from the UI (the design has no control); the actions are kept.
