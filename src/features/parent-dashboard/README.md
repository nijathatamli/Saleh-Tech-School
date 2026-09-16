# Parent portal (`/parent`)

The parent dashboard's UI is `parent-dashboard.html` at the repo root — the
approved design, kept as the source of truth. Nothing here re-creates it: the
file's own markup, inline styles, fonts, icon font and animations are compiled
into React and driven by real data.

## How it fits together

| Piece | What it is |
| --- | --- |
| `template.html` | The `<x-dc>` template body of `parent-dashboard.html`, verbatim, with the prototype's demo text turned into `{{ bindings }}`, the phone-frame/status-bar/preview chrome removed, a logout control and a few empty states added in the file's own style. Payments were removed from the portal. |
| `scripts/dc-template-to-tsx.mjs` | Generator: template → `template.generated.tsx` (React render function) + `styles/template.generated.css` (the `style-hover/active/focus` rules). Run `node scripts/dc-template-to-tsx.mjs` after editing the template. |
| `avatar-bases.generated.ts` | The file's avatar-circle styles, lifted out so a real photo can fill them. |
| `logic.ts` | Port of the file's `renderVals()` — identical style builders (nav, tabs, chips, bars, calendar, chart maths) fed by the portal snapshot instead of demo arrays. |
| `az.ts` | Azerbaijani date/number formatting without locale data (identical on server and client), school timezone. |
| `data.ts` | `loadParentPortal()` — one Prisma snapshot of the signed-in parent: children, attendance, homework, progress, grades, badges, next lesson, notifications, preferences. |
| `actions.ts` | Server actions behind the buttons: mark notifications read, update profile, avatar, notification preferences. |
| `notify.ts` | `notifyParentsOfStudents()` — used by teacher actions to create parent notifications, honouring each parent's preferences. |
| `ParentDashboard.tsx` | Client component: the file's interactive state (screen, month tab, homework filter, language, toggles, "lit" animation) + routing, child switching, logout. |
| `styles/` | `fonts.css` (Inter + Plus Jakarta Sans, extracted from the file), `fontawesome.css` (FA 6 solid, extracted), `base.css` (the file's base rules + keyframes, scoped to `.pp-root`), `portal.css` (neutralises the app's global CSS inside the portal; picks desktop vs mobile tree by viewport). |

Routes: `src/app/parent/[[...slug]]/page.tsx` serves `/parent`,
`/parent/children`, `/parent/attendance`, `/parent/homework`,
`/parent/notifications`, `/parent/settings`; `?child=<id>` selects a child.
Access: `middleware.ts` (session + PARENT role) and the page's own session check.

## Where the data comes from

Teachers enter everything in the teacher panel; each action also notifies the parent:

- Lessons — `teacher/classes/[id]` → "Yeni dərs" (`createLesson`) → **Növbəti dərs**, attendance targets.
- Attendance — `teacher/classes/[id]/attendance/[lessonId]` (`markAttendance`) → ring, calendar, tiles, notes.
- Homework — `teacher/homework/new` (`createHomework`) → homework list; grading (`gradeSubmission`) writes the score, the teacher note and a `Grade` row → **Müəllim qeydi**, progress trend.
- Skills — `teacher/students/[id]` (`updateSkillProgress`) → **Öyrənmə inkişafı** bars.
- Badges — `teacher/students/[id]` (`awardBadge`) → **Nailiyyətlər**.

## Updating the UI when the HTML changes

1. Regenerate `template.html` from the new file (the bindings are text-only substitutions; see the commit that introduced this folder for the exact list).
2. `node scripts/dc-template-to-tsx.mjs`
3. Adjust `vals.ts`/`logic.ts` only if bindings were added or removed.

Database: `prisma/patches/2026-09-16-parent-notification-prefs.sql` adds the
two preference columns; apply with `node scripts/db-apply-patch.mjs <file>`
(uses `DATABASE_URL`).
