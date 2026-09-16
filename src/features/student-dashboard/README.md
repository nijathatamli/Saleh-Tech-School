# Student dashboard (`/student`)

The student dashboard's UI is `student-dashboard.html` at the repo root — the
approved design, kept as the source of truth. Nothing here re-creates it: the
file's own markup, inline styles, fonts, icon font and animations are compiled
into React and driven by real data — the same pipeline as
`src/features/parent-dashboard/`.

## How it fits together

| Piece | What it is |
| --- | --- |
| `template.html` | The `<x-dc>` template body of `student-dashboard.html`, verbatim, with the prototype's demo text turned into `{{ bindings }}`, the phone-frame/status-bar/preview chrome removed, and — in the file's own style — a logout control, a "Təhvil ver" hand-in button on active tasks, a "Şəkli dəyiş" button on the profile, and empty states. The "Bugünkü challenge" card is kept but hidden (`hasChallenge`) until a challenge source exists. |
| `scripts/dc-template-to-tsx.mjs` | Shared generator (feature table at the top): template → `template.generated.tsx` + `styles/template.generated.css`. Run `node scripts/dc-template-to-tsx.mjs student-dashboard` after editing the template. |
| `avatar-bases.generated.ts` | The file's avatar-circle styles, lifted out so a real photo can fill them. |
| `logic.ts` | Port of the file's `renderVals()` — identical style builders (nav, tabs, chips, bars, rings, streak, project art, medals, leaderboard rows, calendar) fed by the snapshot. Also exports `nextLevelXp()` (placeholder curve) and `levelTitle()` (level ladder) to swap later. |
| `az.ts` | Re-exports the parent portal's Azerbaijani formatting and adds the dative suffix + weekday tiles this design needs. |
| `data.ts` | `loadStudentDashboard()` — one Prisma snapshot of the signed-in student: courses + modules, skills, grades, attendance, homework, projects, the badge catalogue with what is earned, upcoming lessons, leaderboard, unread notifications. |
| `actions.ts` | Server actions: hand in homework, change avatar. |
| `StudentDashboard.tsx` | Client component: the file's interactive state (screen, XP count-up, "lit" animation, homework filter) + routing, logout. |
| `styles/` | `fa-regular.css` (the regular icon face this design uses; solid face + classes come from the parent's `fontawesome.css`), `base.css` (the file's base rules + keyframes, scoped to `.sd-root`), `portal.css` (neutralises the app's globals inside the dashboard; picks desktop vs mobile tree by viewport). Fonts are imported from the parent folder — not duplicated. |

Routes: `src/app/student/[[...slug]]/page.tsx` serves `/student`, `/student/progress`,
`/student/attendance`, `/student/homework`, `/student/portfolio`,
`/student/leaderboard`, `/student/settings`. Access: `middleware.ts` (session +
STUDENT role) and the page's own session check.

## Where the data comes from

| UI | Source |
| --- | --- |
| Greeting, avatar, level pill, level card | `student.firstName/avatarUrl/level/xp` + `nextLevelXp()` |
| Next lesson | first upcoming `Lesson` of the student's classes (teacher, photo, link) |
| Today's task | earliest `Submission` in PENDING/OVERDUE |
| Continue learning / recommendation | first enrollment's `Course` + its `CourseModule`s; module position derived from average skill progress |
| XP this month | graded homework × 20 + projects × 100 (the XP rules the card lists) |
| Streak | `student.streakDays` |
| Progress bars / skills | `SkillProgress` |
| Trend chart | monthly average of `Grade` rows (no XP history exists) |
| Attendance ring, tiles, calendar | `Attendance` (latest month with records) |
| Upcoming lessons | next 5 `Lesson`s |
| Projects | `Project` (image, technologies, tag); shown as completed — the model has no progress field |
| Achievements | `Badge` catalogue + `StudentBadge` (earned dated, others "Kilidli"), plus the streak when ≥ 7 days |
| Leaderboard | `getLeaderboard()` top 8 + the signed-in student with their real rank |
| Recent activity | submissions, badges, projects by date |
