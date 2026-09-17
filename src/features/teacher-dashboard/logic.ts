// Port of teacher-dashboard.html's `renderVals()`: the same style builders
// (navItems, bar, seg, chip, row, smallBtn, calendar cells, medal-less rosters)
// with the prototype's demo arrays replaced by the teacher's real snapshot.
import { MONTHS, clock, dayDiff, dayMonth, initialsOf, longDate, parts, twoDigits, type Parts } from "@/features/parent-dashboard/az";
import { WEEKDAYS_LONG } from "@/features/student-dashboard/az";
import { AVATAR_BASES } from "./avatar-bases.generated";
import type { TeacherClass, TeacherDashboardData, TeacherStudent } from "./types";
import type { RosterVal, TemplateVals } from "./vals";

export const ACCENT = "#FF6B00";
const ACCENT_TEXT = "#E66000";

export const HOME = "/teacher";
export const SECTIONS = ["/teacher", "/teacher/classes", "/teacher/homework", "/teacher/students", "/teacher/profile"] as const;
export type Section = (typeof SECTIONS)[number];

export type DetailKind = "class" | "student" | "attendance" | "grading" | "newhw";
export type Detail = { kind: DetailKind; key: string; lessonId?: string } | null;

export type MobileKey = "home" | "classes" | "homework" | "students" | "profile";
export type HwFilter = "Hamısı" | "Aktiv" | "Qiymətləndirilmiş";
export type NotifPrefs = { submission: boolean; absence: boolean; weekly: boolean };
export type Mark = "p" | "l" | "a";

/** The fixed time slots the design offers when adding a lesson. */
export const TIME_SLOTS = ["11:00", "13:00", "16:00", "17:00", "18:00", "19:45"];
const SCORE_OPTIONS = ["60", "70", "80", "90", "100"];

export type UiState = {
  nav: Section;
  detail: Detail;
  mnav: MobileKey;
  lit: boolean;
  hwFilter: HwFilter;
  classFilter: string; // "Hamısı" or a class id
  notif: NotifPrefs;
  month: { y: number; m: number };
  pickedDay: number;
  addingLesson: boolean;
  draftClassId: string | null;
  draftTime: string;
  attMarks: Record<string, Mark>;
  attSaved: boolean;
  scores: Record<string, string>;
  gradesSaved: boolean;
  newHwClassId: string | null;
};

export type Actions = {
  go: (href: Section) => void;
  goMobile: (key: MobileKey) => void;
  back: () => void;
  open: (detail: NonNullable<Detail>) => void;
  setHwFilter: (f: HwFilter) => void;
  setClassFilter: (f: string) => void;
  toggleNotif: (key: keyof NotifPrefs) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  pickDay: (d: number) => void;
  startAdd: () => void;
  cancelAdd: () => void;
  confirmAdd: (classId: string, isoDate: string) => void;
  setDraftClass: (id: string) => void;
  setDraftTime: (t: string) => void;
  removeLesson: (lessonId: string) => void;
  markAll: (studentIds: string[]) => void;
  setMark: (studentId: string, mark: Mark) => void;
  saveAttendance: (lessonId: string) => void;
  pickScore: (submissionId: string, score: string) => void;
  saveGrades: (rows: { submissionId: string; inputName: string }[]) => void;
  setNewHwClass: (id: string) => void;
  createHw: (classId: string | null) => void;
  sendNote: (studentId: string) => void;
  writeParent: (email: string | null, studentName: string) => void;
  changeAvatar: () => void;
  saveProfile: () => void;
  cancelProfile: () => void;
  logout: () => void;
};

export function mobileKeyForSection(nav: string): MobileKey {
  if (nav === "/teacher/classes") return "classes";
  if (nav === "/teacher/homework") return "homework";
  if (nav === "/teacher/students") return "students";
  if (nav === "/teacher/profile") return "profile";
  return "home";
}

export function sectionForMobileKey(key: MobileKey): Section {
  return key === "home" ? "/teacher" : (`/teacher/${key}` as Section);
}

type Tone = "due" | "open" | "done";

function avatar(base: string, url: string | null | undefined) {
  return url ? `${base};background-image:url("${url}");background-size:cover;background-position:center;color:transparent` : base;
}

function avg(values: number[]) {
  return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
}

function relativeDay(target: Parts, now: Parts) {
  const diff = dayDiff(now, target);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Sabah";
  if (diff === -1) return "Dünən";
  return dayMonth(target);
}

/** Per-student figures, every one derived from the roster data. */
export function studentMetrics(s: TeacherStudent, now: Parts) {
  const total = s.attendance.length;
  const present = s.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const att = total ? Math.round((present / total) * 100) : 0;
  const graded = s.submissions.filter((x) => x.status === "GRADED" && x.score !== null);
  const grade = graded.length ? Math.round(graded.reduce((sum, x) => sum + (x.score as number), 0) / graded.length) : null;
  const handedIn = s.submissions.filter((x) => x.status === "SUBMITTED" || x.status === "GRADED").length;
  const overdue = s.submissions.filter((x) => x.status === "OVERDUE" || (x.status === "PENDING" && dayDiff(now, parts(x.dueDate)) < 0)).length;
  return { att, hasAtt: total > 0, grade, hw: `${handedIn} / ${s.submissions.length}`, overdue };
}

export function buildVals(data: TeacherDashboardData, state: UiState, act: Actions): TemplateVals {
  const accent = ACCENT;
  const accentText = ACCENT_TEXT;
  const { nav, detail, mnav, lit, hwFilter, classFilter, notif, month, pickedDay, addingLesson, draftTime, attMarks, attSaved, scores, gradesSaved } = state;
  const now = parts(data.now);
  const first = data.teacher.name.trim().split(/\s+/)[0] ?? "";

  const byId = new Map(data.students.map((s) => [s.id, s]));
  const classById = new Map(data.classes.map((c) => [c.id, c]));
  const rosterOf = (classId: string) => (classById.get(classId)?.studentIds ?? []).map((id) => byId.get(id)).filter((s): s is TeacherStudent => !!s);
  const metrics = new Map(data.students.map((s) => [s.id, studentMetrics(s, now)]));
  const avgAtt = (list: TeacherStudent[]) => avg(list.map((s) => metrics.get(s.id)!.att));
  const avgGrade = (list: TeacherStudent[]) => {
    const g = list.map((s) => metrics.get(s.id)!.grade).filter((x): x is number => x !== null);
    return g.length ? String(avg(g)) : "—";
  };
  const lessonsOf = (classId: string) => data.lessons.filter((l) => l.classId === classId);
  const lessonDated = data.lessons.map((l) => ({ ...l, p: parts(l.date), start: new Date(l.date).getTime() })).sort((a, b) => a.start - b.start);
  const nearestLesson = (classId: string) => {
    const mine = lessonDated.filter((l) => l.classId === classId);
    const todayOrNext = mine.find((l) => dayDiff(now, l.p) >= 0);
    const past = [...mine].reverse().find((l) => dayDiff(now, l.p) < 0);
    const today = mine.find((l) => dayDiff(now, l.p) === 0);
    return today ?? past ?? todayOrNext ?? null;
  };

  // ---- verbatim style helpers ------------------------------------------------------
  const bar = (pct: number) => `height:100%;width:${lit ? pct : 0}%;border-radius:999px;background:${accent};transition:width 1.05s cubic-bezier(0.22,1,0.36,1)`;
  const seg = (active: boolean) =>
    [
      "padding:9px 16px;border-radius:11px;border:none;cursor:pointer;font-size:12.5px;font-weight:600;letter-spacing:-0.005em",
      "transition:background 0.2s ease,color 0.2s ease,box-shadow 0.2s ease",
      active ? "background:#fff;color:#171717;box-shadow:0 2px 8px -4px rgba(23,23,23,0.3)" : "background:transparent;color:#6F6F6B",
    ].join(";");
  const chip = (tone: Tone) =>
    [
      "padding:6px 12px;border-radius:9px;font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0",
      tone === "due" ? `background:${accent}14;color:${accentText}` : tone === "done" ? "background:#F0EFEB;color:#4A4A46" : "background:#F2F2EF;color:#6F6F6B",
    ].join(";");
  const row = (i: number, pad?: string) => `display:flex;align-items:center;gap:16px;padding:${pad || "20px 30px"};${i ? "border-top:1px solid rgba(23,23,23,0.055)" : ""}`;
  const smallBtn = (active: boolean) =>
    [
      "padding:9px 14px;border-radius:11px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap",
      "transition:background 0.18s ease,color 0.18s ease,border-color 0.18s ease",
      active ? `background:${accent};color:#fff;border:1px solid ${accent}` : "background:#fff;color:#6F6F6B;border:1px solid rgba(23,23,23,0.1)",
    ].join(";");

  const rosterRow = (s: TeacherStudent, i: number, pad: string, attWidth: string, attSize: string): RosterVal => {
    const m = metrics.get(s.id)!;
    const cls = classById.get(s.classId);
    return {
      name: s.name,
      initials: initialsOf(s.name),
      grade: m.grade === null ? "—" : String(m.grade),
      hw: m.hw,
      att: m.hasAtt ? `${m.att}%` : "—",
      meta: cls?.code ?? "",
      rowStyle: row(i, pad) + ";cursor:pointer;transition:background 0.18s ease",
      attStyle: [
        `width:${attWidth};text-align:right;flex-shrink:0;font-size:${attSize};font-weight:600;font-variant-numeric:tabular-nums`,
        m.hasAtt && m.att < 75 ? `color:${accentText}` : "color:#171717",
      ].join(";"),
      onOpen: () => act.open({ kind: "student", key: s.id }),
      avatarDetail: avatar(AVATAR_BASES.avatarDetail, s.avatarUrl),
      avatarAttendance: avatar(AVATAR_BASES.avatarAttendance, s.avatarUrl),
      avatarDay: avatar(AVATAR_BASES.avatarDay, s.avatarUrl),
      avatarList: avatar(AVATAR_BASES.avatarList, s.avatarUrl),
      avatarDayMobile: avatar(AVATAR_BASES.avatarDayMobile, s.avatarUrl),
      avatarListMobile: avatar(AVATAR_BASES.avatarListMobile, s.avatarUrl),
      mobileRowStyle: `display:flex;align-items:center;gap:12px;padding:14px 20px;${i ? "border-top:1px solid rgba(23,23,23,0.055)" : ""}`,
    };
  };

  // ---- home figures ---------------------------------------------------------------------
  const submitted = data.students.flatMap((s) => s.submissions.filter((x) => x.status === "SUBMITTED"));
  const pendingTotal = submitted.length;
  const queue = data.homeworks
    .map((h) => {
      const items = submitted.filter((x) => x.homeworkId === h.id);
      const oldest = items.map((x) => x.submittedAt as string).sort()[0] ?? null;
      return { h, count: items.length, oldest };
    })
    .filter((q) => q.count > 0)
    .sort((a, b) => (a.oldest ?? "").localeCompare(b.oldest ?? ""));
  const oldestDays = queue[0]?.oldest ? dayDiff(parts(queue[0].oldest), now) : 0;

  const todayLessons = lessonDated.filter((l) => dayDiff(now, l.p) === 0);
  const nextLesson = lessonDated.find((l) => l.start >= data.now) ?? null;
  const nextClass = nextLesson ? classById.get(nextLesson.classId) : null;
  const nextRoster = nextLesson ? rosterOf(nextLesson.classId) : [];
  const weekStart = new Date(Date.UTC(now.y, now.m, now.d - ((now.wd + 6) % 7)));
  const weekLessons = lessonDated.filter((l) => {
    const d = Date.UTC(l.p.y, l.p.m, l.p.d) - weekStart.getTime();
    return d >= 0 && d < 7 * 86400000;
  });

  const greeting: [string, string] =
    now.h < 12
      ? [`Sabahınız xeyir, ${first}.`, `Bugün ${todayLessons.length} dərsiniz var.`]
      : now.h < 18
        ? [`Salam, ${first}.`, `Bugün ${todayLessons.length} dərsiniz var.`]
        : [`Axşamınız xeyir, ${first}.`, `${pendingTotal} təhvil qiymətləndirmə gözləyir.`];

  const titles: Record<string, [string, string]> = {
    "/teacher/classes": ["Siniflərim", `${data.classes.length} sinif · ${data.students.length} tələbə.`],
    "/teacher/homework": ["Ev tapşırıqları", "Təyin edilmiş işlər və təhvillər."],
    "/teacher/students": ["Tələbələr", "Davamiyyət, bal və tapşırıq icmalı."],
    "/teacher/profile": ["Profil", "Hesab və bildiriş tənzimləmələri."],
  };
  const mTitles: Record<MobileKey, [string, string]> = {
    home: greeting,
    classes: ["Siniflər", `${data.classes.length} sinif · ${data.students.length} tələbə.`],
    homework: ["Tapşırıq", "Təyin edilmiş işlər."],
    students: ["Tələbələr", "Davamiyyət və bal."],
    profile: ["Profil", "Hesab tənzimləmələri."],
  };

  // ---- detail context ------------------------------------------------------------------------
  const kind = detail?.kind ?? null;
  const activeClass: TeacherClass | null =
    kind === "class" || kind === "attendance" ? classById.get(detail!.key) ?? null : kind === "grading" ? classById.get(data.homeworks.find((h) => h.id === detail!.key)?.classId ?? "") ?? null : null;
  const activeStudent = kind === "student" ? byId.get(detail!.key) ?? null : null;
  const activeHw = kind === "grading" ? data.homeworks.find((h) => h.id === detail!.key) ?? null : null;
  const attLesson =
    kind === "attendance"
      ? (detail!.lessonId ? lessonDated.find((l) => l.id === detail!.lessonId) : null) ?? (activeClass ? nearestLesson(activeClass.id) : null)
      : null;
  const rosterOrFallback = activeClass ? rosterOf(activeClass.id) : [];
  const gradeRosterStudents = activeHw ? rosterOf(activeHw.classId) : [];
  const gradeRows = gradeRosterStudents.map((s) => ({ s, sub: s.submissions.find((x) => x.homeworkId === activeHw!.id) ?? null }));

  const detailTitles: Record<DetailKind, [string, string] | null> = {
    class: activeClass ? [activeClass.name, `${activeClass.courseName} · ${activeClass.courseLevel} · ${rosterOrFallback.length} tələbə`] : null,
    student: activeStudent
      ? [activeStudent.name, `${classById.get(activeStudent.classId)?.code ?? ""} · davamiyyət ${metrics.get(activeStudent.id)!.hasAtt ? `${metrics.get(activeStudent.id)!.att}%` : "—"}`]
      : null,
    attendance: activeClass ? ["Davamiyyət", `${activeClass.name} · ${rosterOrFallback.length} tələbə · ${attLesson ? relativeDay(attLesson.p, now).toLowerCase() : "dərs yoxdur"}`] : null,
    grading: activeHw ? [activeHw.title, `${activeClass?.code ?? ""} · ${gradeRosterStudents.length} tələbə · son tarix ${dayMonth(parts(activeHw.dueDate))}`] : null,
    newhw: ["Yeni tapşırıq", "Sinif seçin və şərtləri yazın."],
  };
  const backLabels: Record<DetailKind, string> = { class: "Siniflər", student: "Geri", attendance: "Geri", grading: "Tapşırıqlar", newhw: "Geri" };

  // ---- Siniflərim calendar ---------------------------------------------------------------------------
  const daysInMonth = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const blanks = (new Date(Date.UTC(month.y, month.m, 1)).getUTCDay() + 6) % 7; // Monday-first
  const lessonsOn = (day: number) => lessonDated.filter((l) => l.p.y === month.y && l.p.m === month.m && l.p.d === day);
  const dueDays = new Set(data.homeworks.map((h) => parts(h.dueDate)).filter((p) => p.y === month.y && p.m === month.m).map((p) => p.d));
  const picked = Math.min(pickedDay, daysInMonth);
  const cal = [];
  for (let i = 0; i < blanks; i++) cal.push({ label: "", style: "height:44px;border:none;background:transparent", dotStyle: "display:none", onPick: () => {} });
  for (let d = 1; d <= daysInMonth; d++) {
    const has = lessonsOn(d).length > 0;
    const due = dueDays.has(d);
    const isPicked = d === picked;
    cal.push({
      label: String(d),
      style: [
        "height:44px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px",
        "font-size:12.5px;font-variant-numeric:tabular-nums;cursor:pointer",
        "transition:background 0.18s ease,color 0.18s ease,border-color 0.18s ease,transform 0.18s ease",
        isPicked
          ? `background:${accent};color:#fff;border:1px solid ${accent};font-weight:700`
          : has
            ? `background:${accent}14;color:#171717;border:1px solid ${accent}2E;font-weight:600`
            : "background:#F7F6F3;color:#6F6F6B;border:1px solid transparent",
      ].join(";"),
      dotStyle: has || due ? `width:5px;height:5px;border-radius:50%;background:${isPicked ? "#fff" : has ? accent : "rgba(23,23,23,0.22)"}` : "width:5px;height:5px;border-radius:50%;background:transparent",
      onPick: () => act.pickDay(d),
    });
  }
  const pickedLessons = lessonsOn(picked);
  const pickedWd = new Date(Date.UTC(month.y, month.m, picked)).getUTCDay();
  const pickedIso = `${month.y}-${twoDigits(month.m + 1)}-${twoDigits(picked)}`;
  const draftClassId = state.draftClassId ?? data.classes[0]?.id ?? null;
  const newHwClassId = state.newHwClassId ?? data.classes[0]?.id ?? null;

  const markedCount = rosterOrFallback.filter((s) => attMarks[s.id]).length;
  const gradedCount = gradeRows.filter(({ s, sub }) => scores[sub?.id ?? ""] || (sub?.status === "GRADED" && !scores[sub.id] && s)).length;

  // ---- homework list ----------------------------------------------------------------------------------------
  const hwItems = data.homeworks.map((h) => {
    const roster = rosterOf(h.classId);
    const subs = roster.map((s) => s.submissions.find((x) => x.homeworkId === h.id)).filter((x): x is NonNullable<typeof x> => !!x);
    const pending = subs.filter((x) => x.status === "SUBMITTED").length;
    const graded = subs.filter((x) => x.status === "GRADED").length;
    const allGraded = subs.length > 0 && graded === subs.length;
    const tone: Tone = allGraded ? "done" : pending > 0 ? "due" : "open";
    return { h, roster, pending, graded, allGraded, tone, notHandedIn: subs.length - pending - graded };
  });
  const toneOrder: Tone[] = ["due", "open", "done"];
  hwItems.sort((a, b) => toneOrder.indexOf(a.tone) - toneOrder.indexOf(b.tone) || a.h.dueDate.localeCompare(b.h.dueDate));
  const hwVisible = hwFilter === "Aktiv" ? hwItems.filter((x) => x.tone !== "done") : hwFilter === "Qiymətləndirilmiş" ? hwItems.filter((x) => x.tone === "done") : hwItems;

  const studentsVisible = classFilter === "Hamısı" ? data.students : rosterOf(classFilter);

  // ---- at-risk list ---------------------------------------------------------------------------------------
  const atRisk = data.students
    .map((s) => ({ s, m: metrics.get(s.id)! }))
    .filter(({ m }) => (m.hasAtt && m.att < 75) || m.overdue > 0)
    .sort((a, b) => a.m.att - b.m.att)
    .slice(0, 5);

  const teacherAvatarUrl = data.teacher.photoUrl;
  const parentOf = (s: TeacherStudent | null) => s?.parentEmail ?? null;

  return {
    pageTitle: kind && detailTitles[kind] ? detailTitles[kind]![0] : titles[nav] ? titles[nav][0] : greeting[0],
    pageSub: kind && detailTitles[kind] ? detailTitles[kind]![1] : titles[nav] ? titles[nav][1] : greeting[1],
    today: longDate(now),
    navItems: (
      [
        ["/teacher", "Dashboard", "fa-solid fa-house", ""],
        ["/teacher/classes", "Siniflərim", "fa-solid fa-school", ""],
        ["/teacher/homework", "Ev tapşırıqları", "fa-solid fa-clipboard-list", pendingTotal ? String(pendingTotal) : ""],
        ["/teacher/students", "Tələbələr", "fa-solid fa-user-group", ""],
        ["/teacher/profile", "Profil", "fa-solid fa-user", ""],
      ] as [Section, string, string, string][]
    ).map(([href, label, icon, badge]) => {
      const active = nav === href;
      return {
        label,
        icon,
        badge,
        style: [
          "display:flex;align-items:center;gap:12px;width:100%;padding:11px 13px;border-radius:14px;cursor:pointer",
          "font-size:13.5px;font-weight:500;letter-spacing:-0.005em;text-align:left",
          "transition:background 0.18s ease,color 0.18s ease",
          active ? `background:${accent}17;color:#171717;border:1px solid ${accent}2E;font-weight:600` : "background:transparent;color:#6F6F6B;border:1px solid transparent",
        ].join(";"),
        badgeStyle: badge
          ? `min-width:19px;height:19px;padding:0 6px;border-radius:999px;background:${active ? accent : "rgba(23,23,23,0.08)"};color:${active ? "#fff" : "#4A4A46"};font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center`
          : "display:none",
        onGo: () => act.go(href),
      };
    }),
    weekLessonsLabel: `${weekLessons.length} dərs`,
    weekSummary: `${data.classes.length} sinif · ${data.students.length} tələbə`,
    teacherInitials: initialsOf(data.teacher.name),
    teacherAvatar0: avatar(AVATAR_BASES.teacherAvatar0, teacherAvatarUrl),
    teacherAvatar1: avatar(AVATAR_BASES.teacherAvatar1, teacherAvatarUrl),
    teacherAvatar2: avatar(AVATAR_BASES.teacherAvatar2, teacherAvatarUrl),
    teacherAvatar3: avatar(AVATAR_BASES.teacherAvatar3, teacherAvatarUrl),
    teacherAvatar4: avatar(AVATAR_BASES.teacherAvatar4, teacherAvatarUrl),
    teacherName: data.teacher.name,
    teacherPosition: data.teacher.position,
    unreadDotStyle: data.unreadNotifications > 0 ? "position:absolute;top:9px;right:10px;width:6px;height:6px;border-radius:50%;background:#FF6B00;border:1.5px solid #fff" : "display:none",
    onLogout: act.logout,
    inDetail: !!kind,
    backLabel: kind ? backLabels[kind] : "",
    goBack: act.back,

    atHome: nav === "/teacher" && !kind,
    atClasses: nav === "/teacher/classes" && !kind,
    atHomework: nav === "/teacher/homework" && !kind,
    atStudents: nav === "/teacher/students" && !kind,
    atProfile: nav === "/teacher/profile" && !kind,
    atClassDetail: kind === "class",
    atStudentDetail: kind === "student",
    atAttendance: kind === "attendance",
    atGrading: kind === "grading",
    atNewHw: kind === "newhw",

    detailStats:
      kind === "student" && activeStudent
        ? [
            { label: "Davamiyyət", value: metrics.get(activeStudent.id)!.hasAtt ? `${metrics.get(activeStudent.id)!.att}%` : "—" },
            { label: "Orta bal", value: metrics.get(activeStudent.id)!.grade === null ? "—" : String(metrics.get(activeStudent.id)!.grade) },
            { label: "Tapşırıq", value: metrics.get(activeStudent.id)!.hw },
            { label: "Sinif", value: classById.get(activeStudent.classId)?.code ?? "—" },
          ]
        : [
            { label: "Tələbələr", value: String(rosterOrFallback.length) },
            { label: "Dərslər", value: String(activeClass ? lessonsOf(activeClass.id).length : 0) },
            { label: "Davamiyyət", value: `${avgAtt(rosterOrFallback)}%` },
            { label: "Orta bal", value: avgGrade(rosterOrFallback) },
          ],
    detailRoster: rosterOrFallback.map((s, i) => rosterRow(s, i, "18px 26px", "96px", "14px")),
    openAttendance: () => {
      const cls = activeClass ?? nextClass ?? data.classes[0] ?? null;
      if (!cls) return;
      const lesson = kind === "class" ? nearestLesson(cls.id) : nextLesson && nextLesson.classId === cls.id ? nextLesson : nearestLesson(cls.id);
      act.open({ kind: "attendance", key: cls.id, lessonId: lesson?.id });
    },
    openNewHw: () => {
      if (activeClass) act.setNewHwClass(activeClass.id);
      act.open({ kind: "newhw", key: activeClass?.id ?? "" });
    },
    studentSkills: (activeStudent?.skills ?? []).map((k) => ({ name: k.name, pctLabel: `${k.pct}%`, barStyle: bar(k.pct) })),
    noSkills: !activeStudent?.skills.length,
    onSendNote: () => act.sendNote(activeStudent?.id ?? ""),
    onWriteParent: () => act.writeParent(parentOf(activeStudent), activeStudent?.name ?? ""),

    markedLabel: `${markedCount} / ${rosterOrFallback.length}`,
    saveLabel: attSaved ? "Yadda saxlanıldı ✓" : "Yadda saxla",
    markAllPresent: () => act.markAll(rosterOrFallback.map((s) => s.id)),
    saveAttendance: () => {
      if (attLesson) act.saveAttendance(attLesson.id);
    },
    attendanceRoster: attLesson
      ? rosterOrFallback.map((s, i) => ({
          name: s.name,
          initials: initialsOf(s.name),
          avatarAttendance: avatar(AVATAR_BASES.avatarAttendance, s.avatarUrl),
          rowStyle: row(i, "18px 26px"),
          options: (
            [
              ["İştirak", "p"],
              ["Gecikmə", "l"],
              ["Qayıb", "a"],
            ] as [string, Mark][]
          ).map(([label, code]) => ({
            label,
            style: smallBtn(attMarks[s.id] === code),
            onPick: () => act.setMark(s.id, code),
          })),
        }))
      : [],
    noAttendanceLesson: kind === "attendance" && !attLesson,

    gradeTitle: activeHw?.title ?? "",
    gradeMeta: activeHw ? detailTitles.grading![1] : "",
    gradedLabel: `${gradedCount} / ${gradeRows.length} qiymətləndirildi`,
    gradeRoster: gradeRows
      .filter(({ sub }) => !!sub)
      .map(({ s, sub }) => {
        const x = sub!;
        const submittedP = x.submittedAt ? parts(x.submittedAt) : null;
        const chosen = scores[x.id] ?? (x.score !== null && SCORE_OPTIONS.includes(String(x.score)) ? String(x.score) : "");
        return {
          id: x.id,
          name: s.name,
          initials: initialsOf(s.name),
          avatar: avatar(AVATAR_BASES.avatar, s.avatarUrl),
          submitted:
            x.status === "GRADED"
              ? `Qiymətləndirilib · ${x.score ?? "—"} bal`
              : x.status === "SUBMITTED" && submittedP
                ? `${relativeDay(submittedP, now)} ${clock(submittedP)}-də göndərildi`
                : "Göndərilməyib",
          file: "",
          fileStyle: "display:none", // submissions carry no attachment in this schema
          feedback: x.feedback ?? "",
          inputName: `fb-${x.id}`,
          scores: SCORE_OPTIONS.map((label) => ({ label, style: smallBtn(chosen === label), onPick: () => act.pickScore(x.id, label) })),
        };
      }),
    noGradeRoster: kind === "grading" && gradeRows.filter(({ sub }) => !!sub).length === 0,
    saveGradesLabel: gradesSaved ? "Yadda saxlanıldı ✓" : "Qiymətləri yadda saxla",
    onSaveGrades: () => act.saveGrades(gradeRows.filter(({ sub }) => !!sub).map(({ sub }) => ({ submissionId: sub!.id, inputName: `fb-${sub!.id}` }))),

    newHwClasses: data.classes.map((c) => ({ label: c.code, style: smallBtn(newHwClassId === c.id), onPick: () => act.setNewHwClass(c.id) })),
    hwDefaultDue: (() => {
      const d = new Date(Date.UTC(now.y, now.m, now.d + 7));
      return `${d.getUTCFullYear()}-${twoDigits(d.getUTCMonth() + 1)}-${twoDigits(d.getUTCDate())}`;
    })(),
    onCreateHw: () => act.createHw(newHwClassId),

    hasNextLesson: !!nextLesson,
    noNextLesson: !nextLesson,
    nextLessonTitle: nextLesson?.title ?? "",
    nextLessonWhen: nextLesson ? `${relativeDay(nextLesson.p, now)} · ${clock(nextLesson.p)} — ${clock(parts(nextLesson.start + nextLesson.minutes * 60000))}` : "",
    nextLessonClass: nextClass?.code ?? "—",
    nextLessonCount: String(nextRoster.length),
    nextLessonMeta: nextClass ? `${nextClass.code} · ${nextRoster.length} tələbə` : "",
    pendingTotal: String(pendingTotal),
    queueMeta: queue.length ? `${queue.length} tapşırıq üzrə · ən köhnəsi ${oldestDays === 0 ? "bugün" : `${oldestDays} gün əvvəl`}` : "Bütün təhvillər qiymətləndirilib.",
    gradingQueue: queue.map((q) => ({
      title: q.h.title,
      count: String(q.count),
      chipStyle: chip(dayDiff(now, parts(q.h.dueDate)) <= 0 ? "due" : "open"),
      onOpen: () => act.open({ kind: "grading", key: q.h.id }),
    })),
    noQueue: queue.length === 0,
    openGrading: () => {
      if (queue[0]) act.open({ kind: "grading", key: queue[0].h.id });
      else act.go("/teacher/homework");
    },
    stats: [
      { label: "Siniflər", value: String(data.classes.length) },
      { label: "Tələbələr", value: String(data.students.length) },
      { label: "Orta davamiyyət", value: `${avgAtt(data.students)}%` },
      { label: "Orta bal", value: avgGrade(data.students) },
    ],
    scheduleCountLabel: `${todayLessons.length} dərs`,
    schedule: todayLessons.map((l, i) => {
      const cls = classById.get(l.classId);
      const end = l.start + l.minutes * 60000;
      const tone: Tone = end < data.now ? "done" : l === lessonDated.find((x) => dayDiff(now, x.p) === 0 && x.start + x.minutes * 60000 >= data.now) ? "due" : "open";
      return {
        time: clock(l.p),
        title: l.title,
        meta: `${cls?.code ?? ""} · ${rosterOf(l.classId).length} tələbə`,
        status: tone === "done" ? "Bitdi" : tone === "due" ? "Növbəti" : "Planlı",
        rowStyle: row(i) + ";cursor:pointer;transition:background 0.18s ease",
        onOpen: () => act.open({ kind: "class", key: l.classId }),
        timeStyle: ["width:56px;flex-shrink:0;font-size:14px;font-weight:600;font-variant-numeric:tabular-nums", tone === "due" ? `color:${accentText}` : "color:#171717"].join(";"),
        chipStyle: chip(tone),
      };
    }),
    noSchedule: todayLessons.length === 0,
    classRates: data.classes.map((c) => {
      const monthLessonIds = new Set(lessonsOf(c.id).filter((l) => { const p = parts(l.date); return p.y === now.y && p.m === now.m; }).map((l) => l.id));
      const records = rosterOf(c.id).flatMap((s) => s.attendance.filter((a) => monthLessonIds.has(a.lessonId)));
      const pct = records.length ? Math.round((records.filter((a) => a.status === "PRESENT" || a.status === "LATE").length / records.length) * 100) : avgAtt(rosterOf(c.id));
      return { name: c.name, pctLabel: `${pct}%`, barStyle: bar(pct) };
    }),
    noClasses: data.classes.length === 0,
    atRisk: atRisk.map(({ s, m }) => {
      const code = classById.get(s.classId)?.code ?? "";
      return {
        name: s.name,
        initials: initialsOf(s.name),
        avatar: avatar(AVATAR_BASES.avatar, s.avatarUrl),
        avatarMobile: avatar(AVATAR_BASES.avatarMobile, s.avatarUrl),
        reason: m.overdue > 0 ? `${code} · ${m.overdue} tapşırıq gecikib` : `${code} · davamiyyət aşağı`,
        metric: m.hasAtt ? `${m.att}%` : "—",
        chipStyle: chip(m.hasAtt && m.att < 75 ? "due" : "open"),
        onOpen: () => act.open({ kind: "student", key: s.id }),
      };
    }),
    noRisk: atRisk.length === 0,

    monthLabel: `${MONTHS[month.m]} ${month.y}`,
    prevMonth: act.prevMonth,
    nextMonth: act.nextMonth,
    weekDays: ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"],
    calendar: cal,
    calendarMobile: cal.map((c) => ({
      label: c.label,
      onPick: c.onPick,
      dotStyle: c.dotStyle,
      style: c.label ? c.style.replace("height:44px", "height:38px").replace("font-size:12.5px", "font-size:11.5px").replace("gap:4px", "gap:3px") : "height:38px;border:none;background:transparent",
    })),
    dayHeading: `${picked} ${MONTHS[month.m]} · ${WEEKDAYS_LONG[pickedWd]}`,
    daySummary: pickedLessons.length ? `${pickedLessons.length} dərs · ${pickedLessons.reduce((n, l) => n + rosterOf(l.classId).length, 0)} tələbə` : "Dərs yoxdur",
    dayHasLessons: pickedLessons.length > 0,
    dayEmpty: pickedLessons.length === 0,
    isAdding: addingLesson,
    notAdding: !addingLesson,
    startAdd: act.startAdd,
    cancelAdd: act.cancelAdd,
    confirmAdd: () => {
      if (draftClassId) act.confirmAdd(draftClassId, `${pickedIso}T${draftTime}`);
    },
    addLabel: `${picked} ${MONTHS[month.m]} üçün dərs əlavə et`,
    draftClasses: data.classes.map((c) => ({ label: `${c.code} · ${c.name}`, style: smallBtn(draftClassId === c.id), onPick: () => act.setDraftClass(c.id) })),
    draftClassCodes: data.classes.map((c) => ({ label: c.code, style: smallBtn(draftClassId === c.id), onPick: () => act.setDraftClass(c.id) })),
    draftTimes: TIME_SLOTS.map((t) => ({ label: t, style: smallBtn(draftTime === t), onPick: () => act.setDraftTime(t) })),
    dayLessons: pickedLessons.map((l) => {
      const cls = classById.get(l.classId);
      const roster = rosterOf(l.classId);
      return {
        time: clock(l.p),
        className: cls?.name ?? l.title,
        meta: `${cls?.code ?? ""} · ${cls?.courseName ?? ""} · ${roster.length} tələbə`,
        timeStyle: `width:64px;flex-shrink:0;font-family:'Plus Jakarta Sans',sans-serif;font-size:17px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;color:${accentText}`,
        onOpen: () => act.open({ kind: "class", key: l.classId }),
        onAttendance: () => act.open({ kind: "attendance", key: l.classId, lessonId: l.id }),
        onRemove: () => act.removeLesson(l.id),
        roster: roster.map((s, i) => rosterRow(s, i, "16px 30px", "84px", "13.5px")),
      };
    }),
    classes: data.classes.map((c) => {
      const roster = rosterOf(c.id);
      const pct = avgAtt(roster);
      return {
        name: c.name,
        course: `${c.courseName} · ${c.courseLevel}`,
        code: c.code,
        tagStyle: `padding:6px 12px;border-radius:9px;background:${accent}14;color:${accentText};font-size:11.5px;font-weight:600;flex-shrink:0;white-space:nowrap`,
        stats: [
          { v: String(roster.length), k: "tələbə" },
          { v: String(lessonsOf(c.id).length), k: "dərs" },
          { v: `${pct}%`, k: "davamiyyət" },
        ],
        barStyle: bar(pct),
        onOpen: () => act.open({ kind: "class", key: c.id }),
        onAttendance: () => act.open({ kind: "attendance", key: c.id, lessonId: nearestLesson(c.id)?.id }),
      };
    }),

    hwTabs: (["Hamısı", "Aktiv", "Qiymətləndirilmiş"] as HwFilter[]).map((label) => ({ label, style: seg(hwFilter === label), onGo: () => act.setHwFilter(label) })),
    hwList: hwVisible.map((x, i) => ({
      title: x.h.title,
      meta: `${classById.get(x.h.classId)?.code ?? ""} · ${x.roster.length} tələbə`,
      due: x.allGraded ? "Tamamlandı" : relativeDay(parts(x.h.dueDate), now),
      status: x.pending ? `${x.pending} gözləyir` : x.allGraded ? "Qiymətləndirildi" : `${x.notHandedIn} göndərilməyib`,
      rowStyle: row(i) + ";cursor:pointer;transition:background 0.18s ease",
      onOpen: () => act.open({ kind: "grading", key: x.h.id }),
      icon: x.tone === "done" ? "fa-solid fa-check" : "fa-solid fa-file-lines",
      iconStyle: [
        "width:38px;height:38px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0",
        x.tone === "due" ? `background:${accent}14;color:${accentText}` : "background:#F2F2EF;color:#4A4A46",
      ].join(";"),
      chipStyle: chip(x.tone),
    })),
    hwEmpty: hwVisible.length === 0,

    classTabs: [{ id: "Hamısı", label: "Hamısı" }, ...data.classes.map((c) => ({ id: c.id, label: c.code }))].map((t) => ({
      label: t.label,
      style: seg(classFilter === t.id),
      onGo: () => act.setClassFilter(t.id),
    })),
    students: studentsVisible.map((s, i) => rosterRow(s, i, "18px 26px", "100px", "14px")),
    noStudents: studentsVisible.length === 0,

    profileStats: [
      { k: "Siniflər", v: String(data.classes.length) },
      { k: "Tələbələr", v: String(data.students.length) },
      { k: "Dərs / həftə", v: String(weekLessons.length) },
      { k: "Kurslar", v: String(new Set(data.classes.map((c) => c.courseName)).size) },
    ],
    fields: [
      { label: "Ad Soyad", value: data.teacher.name, name: "name", readOnly: false },
      { label: "E-poçt", value: data.teacher.email, name: "email", readOnly: true },
      { label: "Telefon", value: data.teacher.phone ?? "", name: "phone", readOnly: false },
      { label: "Vəzifə", value: data.teacher.position, name: "position", readOnly: false },
    ],
    toggles: (
      [
        { key: "submission", label: "Yeni təhvillər", desc: "Tələbə tapşırıq göndərdikdə bildiriş" },
        { key: "absence", label: "Davamiyyət xəbərdarlığı", desc: "Davamiyyət 75%-dən aşağı düşdükdə" },
        { key: "weekly", label: "Həftəlik icmal", desc: "Hər bazar günü e-poçt hesabatı" },
      ] as { key: keyof NotifPrefs; label: string; desc: string }[]
    ).map((t) => {
      const on = notif[t.key];
      return {
        label: t.label,
        desc: t.desc,
        trackStyle: [
          "position:relative;width:46px;height:28px;border-radius:999px;border:none;cursor:pointer;flex-shrink:0;padding:0",
          "transition:background 0.24s cubic-bezier(0.22,1,0.36,1)",
          on ? `background:${accent}` : "background:#E4E1DA",
        ].join(";"),
        knobStyle: [
          "position:absolute;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;display:block",
          "box-shadow:0 1px 3px rgba(23,23,23,0.28)",
          "transition:left 0.24s cubic-bezier(0.22,1,0.36,1)",
          on ? "left:21px" : "left:3px",
        ].join(";"),
        onToggle: () => act.toggleNotif(t.key),
      };
    }),
    onChangeAvatar: act.changeAvatar,
    onSaveProfile: act.saveProfile,
    onCancelProfile: act.cancelProfile,

    mAtHome: mnav === "home",
    mAtClasses: mnav === "classes",
    mAtHomework: mnav === "homework",
    mAtStudents: mnav === "students",
    mAtProfile: mnav === "profile",
    mTitle: mTitles[mnav][0],
    mSub: mTitles[mnav][1],
    mobileNav: (
      [
        ["home", "Ana", "fa-solid fa-house"],
        ["classes", "Siniflər", "fa-solid fa-school"],
        ["homework", "Tapşırıq", "fa-solid fa-clipboard-list"],
        ["students", "Tələbələr", "fa-solid fa-user-group"],
        ["profile", "Profil", "fa-solid fa-user"],
      ] as [MobileKey, string, string][]
    ).map(([key, label, icon]) => {
      const active = mnav === key;
      return {
        label,
        icon,
        style: [
          "flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 4px 8px 4px;cursor:pointer",
          "background:transparent;border:none;border-radius:14px",
          "transition:color 0.2s ease",
          active ? `color:${accent}` : "color:#6F6F6B",
        ].join(";"),
        labelStyle: ["font-size:9.5px;letter-spacing:0.01em", "transition:color 0.2s ease", active ? "font-weight:700;color:#171717" : "font-weight:600"].join(";"),
        dotStyle: [
          "width:4px;height:4px;border-radius:50%;margin-top:1px",
          "transition:opacity 0.2s ease,transform 0.2s ease",
          active ? `background:${accent};opacity:1;transform:scale(1)` : "background:transparent;opacity:0;transform:scale(0.6)",
        ].join(";"),
        onGo: () => act.goMobile(key),
      };
    }),
  };
}
