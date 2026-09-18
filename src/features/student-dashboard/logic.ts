// Port of student-dashboard.html's `renderVals()`: the same style builders
// (nav, segmented tabs, chips, bars, ring maths, streak cells/pips, project
// art, medals, leaderboard rows, calendar) with the prototype's demo arrays
// replaced by the student's real snapshot.
import {
  MONTHS,
  MONTHS_SHORT,
  WEEKDAYS_LONG,
  WEEKDAYS_TILE,
  clock,
  dative,
  dayDiff,
  dayMonth,
  groupNumber,
  initialsOf,
  locativePossessive,
  monthLocative,
  parts,
  possessive,
  type Parts,
} from "./az";
import { AVATAR_BASES } from "./avatar-bases.generated";
import type { StudentDashboardData, StudentSubmission } from "./types";
import type { TemplateVals } from "./vals";

export const ACCENT = "#FF6B00";
const ACCENT_TEXT = "#E66000";

export const HOME = "/student";
export const ROUTES = [
  "/student",
  "/student/progress",
  "/student/attendance",
  "/student/homework",
  "/student/settings",
  "/student/portfolio",
  "/student/leaderboard",
] as const;
export type Route = (typeof ROUTES)[number];

export type MobileKey = "home" | "progress" | "attendance" | "homework" | "settings";
export type HwFilter = "Hamısı" | "Aktiv" | "Tamamlandı";

/** XP needed to finish the current level — the prototype's placeholder curve, kept in one place so it can be swapped. */
export function nextLevelXp(level: number) {
  return (level + 1) * 125;
}

/** Title shown next to the level ("Cyber Explorer" in the prototype). Ladder by level band; swap with the real one when defined. */
export function levelTitle(level: number) {
  if (level >= 20) return "Tech Master";
  if (level >= 15) return "Tech Builder";
  if (level >= 10) return "Cyber Explorer";
  if (level >= 5) return "Kəşfiyyatçı";
  return "Yeni başlayan";
}

// The school's XP rules as the design lists them (used for the labels only).
const XP_RULES = { homework: 20, project: 100, quiz: 50 };

export type UiState = {
  nav: Route;
  mnav: MobileKey;
  lit: boolean;
  /** animated XP counter value (counts up to student.xp on mount) */
  xp: number;
  hwFilter: HwFilter;
};

export type Actions = {
  go: (href: Route) => void;
  goMobile: (key: MobileKey) => void;
  setHwFilter: (f: HwFilter) => void;
  logout: () => void;
  goLesson: (link: string | null) => void;
  startTask: (submissionId: string | null) => void;
  continueCourse: (slug: string | null) => void;
  submitHomework: (submissionId: string) => void;
  changeAvatar: () => void;
};

export function mobileKeyForRoute(nav: string): MobileKey {
  if (nav === "/student/progress") return "progress";
  if (nav === "/student/attendance") return "attendance";
  if (nav === "/student/homework") return "homework";
  if (nav === "/student/settings" || nav === "/student/portfolio" || nav === "/student/leaderboard") return "settings";
  return "home";
}

export function routeForMobileKey(key: MobileKey): Route {
  return key === "home" ? "/student" : (`/student/${key}` as Route);
}

type Tone = "due" | "open" | "done";

const HW_ORDER: StudentSubmission["status"][] = ["OVERDUE", "PENDING", "SUBMITTED", "GRADED"];

const BADGE_ICONS: Record<string, string> = {
  "cyber-defender": "fa-solid fa-shield-halved",
  "python-master": "fa-solid fa-code",
  "first-project": "fa-solid fa-cube",
  "robot-builder": "fa-solid fa-robot",
  "competition-winner": "fa-solid fa-trophy",
  "streak-10": "fa-solid fa-fire",
};

const PROJECT_ICONS: Record<string, string> = {
  cybersecurity: "fa-solid fa-shield-halved",
  robotics: "fa-solid fa-robot",
  python: "fa-solid fa-code",
  programming: "fa-solid fa-code",
  web: "fa-solid fa-globe",
  ai: "fa-solid fa-brain",
  electronics: "fa-solid fa-microchip",
};

// the three card gradients the design cycles through
const PROJECT_ART = [
  ["#1C1B19", "#33302B"],
  ["#2A2825", "#403C36"],
  ["#24221F", "#3A362F"],
];

function ageOf(birthDate: string, now: Parts) {
  const b = parts(birthDate);
  let age = now.y - b.y;
  if (now.m < b.m || (now.m === b.m && now.d < b.d)) age -= 1;
  return Math.max(age, 0);
}

function avg(values: number[]) {
  return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
}

/** The file's avatar circle, filled with a real photo when one exists (initials stay for a11y, hidden). */
function avatar(base: string, url: string | null | undefined) {
  return url ? `${base};background-image:url("${url}");background-size:cover;background-position:center;color:transparent` : base;
}

function relativeDay(target: Parts, now: Parts) {
  const diff = dayDiff(now, target);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Sabah";
  if (diff === -1) return "Dünən";
  return dayMonth(target);
}

export function buildVals(data: StudentDashboardData, state: UiState, act: Actions): TemplateVals {
  const accent = ACCENT;
  const accentText = ACCENT_TEXT;
  const { nav, mnav, lit, hwFilter, xp } = state;
  const now = parts(data.now);
  const { student } = data;
  const first = student.firstName;
  const fullName = `${student.firstName} ${student.lastName}`;

  const greeting: [string, string] =
    now.h < 12
      ? [`Sabahın xeyir, ${first} 👋`, "Bu gün nə yaradacağıq?"]
      : now.h < 18
        ? [`Salam, ${first} 👋`, "Bu gün nə yaradacağıq?"]
        : [`Axşamın xeyir, ${first} 👋`, "Bir dərs daha — davam edək."];

  // ---- level / xp ---------------------------------------------------------------
  const target = nextLevelXp(student.level);
  const levelPct = Math.min(100, Math.round((student.xp / target) * 100));
  const title = levelTitle(student.level);

  // ---- homework ------------------------------------------------------------------
  const submissions = [...data.submissions].sort((a, b) => {
    const byStatus = HW_ORDER.indexOf(a.status) - HW_ORDER.indexOf(b.status);
    if (byStatus) return byStatus;
    const done = a.status === "SUBMITTED" || a.status === "GRADED";
    return done ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate);
  });
  const active = submissions.filter((s) => s.status === "PENDING" || s.status === "OVERDUE");
  const todaysTask = [...active].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;
  const toneOf = (s: StudentSubmission): Tone => {
    if (s.status === "SUBMITTED" || s.status === "GRADED") return "done";
    if (s.status === "OVERDUE") return "due";
    return dayDiff(now, parts(s.dueDate)) <= 0 ? "due" : "open";
  };
  const statusOf = (s: StudentSubmission, tone: Tone) =>
    s.status === "GRADED" ? "Tamamlandı" : s.status === "SUBMITTED" ? "Yoxlanılır" : s.status === "OVERDUE" ? "Gecikmiş" : tone === "due" ? "Davam edir" : "Başlanmadı";
  const dueOf = (s: StudentSubmission) => {
    if (s.status === "GRADED") return s.score !== null ? `${s.score} bal` : `+${XP_RULES.homework} XP`;
    if (s.status === "SUBMITTED") return "Təhvil verilib";
    return relativeDay(parts(s.dueDate), now);
  };
  const HW = submissions.map((s) => ({ s, tone: toneOf(s) }));
  const hwVisible = hwFilter === "Aktiv" ? HW.filter((x) => x.tone !== "done") : hwFilter === "Tamamlandı" ? HW.filter((x) => x.tone === "done") : HW;

  // ---- course / modules -------------------------------------------------------------
  const course = data.courses[0] ?? null;
  const overall = avg(data.subjects.map((s) => s.pct));
  const moduleCount = course?.modules.length ?? 0;
  const currentModule = moduleCount ? Math.min(moduleCount, Math.max(1, Math.ceil((overall / 100) * moduleCount))) : 0;
  const nextModule = course && currentModule < moduleCount ? course.modules[currentModule] : null;
  const bestSubject = [...data.subjects].sort((a, b) => b.pct - a.pct)[0] ?? null;

  // ---- xp this month (per the XP rules, from what actually happened) ----------------
  const inThisMonth = (isoDate: string) => {
    const p = parts(isoDate);
    return p.y === now.y && p.m === now.m;
  };
  const xpThisMonth =
    data.submissions.filter((s) => s.status === "GRADED" && s.submittedAt && inThisMonth(s.submittedAt)).length * XP_RULES.homework +
    data.projects.filter((p) => inThisMonth(p.createdAt)).length * XP_RULES.project;

  // ---- attendance ---------------------------------------------------------------------
  const attDated = data.attendance.map((r) => ({ ...r, p: parts(r.date) }));
  const counts = (records: typeof attDated) => {
    const c = { present: 0, late: 0, absent: 0 };
    for (const r of records) {
      if (r.status === "PRESENT") c.present += 1;
      else if (r.status === "LATE") c.late += 1;
      else c.absent += 1;
    }
    return c;
  };
  const allCounts = counts(attDated);
  const attendancePct = attDated.length ? Math.round(((allCounts.present + allCounts.late) / attDated.length) * 100) : 0;
  const monthCandidates: { y: number; m: number }[] = [];
  for (let back = 0; back <= 2; back++) {
    const d = new Date(Date.UTC(now.y, now.m - back, 1));
    monthCandidates.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  }
  const inMonth = (t: { y: number; m: number }) => attDated.filter((r) => r.p.y === t.y && r.p.m === t.m);
  // the latest of the last three months with lessons recorded (else the current month)
  const attMonth = monthCandidates.find((t) => inMonth(t).length > 0) ?? monthCandidates[0];
  const monthRecords = inMonth(attMonth);
  const monthCounts = counts(monthRecords);
  const attended = monthCounts.present + monthCounts.late;

  // Attendance grid — Monday-first, same cell skins as the file
  const attBlanks = (new Date(Date.UTC(attMonth.y, attMonth.m, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(attMonth.y, attMonth.m + 1, 0)).getUTCDate();
  const ATT: Record<number, "p" | "l" | "a"> = {};
  const rank = { p: 0, l: 1, a: 2 };
  for (const r of monthRecords) {
    const st: "p" | "l" | "a" = r.status === "PRESENT" ? "p" : r.status === "LATE" ? "l" : "a";
    if (!ATT[r.p.d] || rank[st] > rank[ATT[r.p.d]]) ATT[r.p.d] = st;
  }
  const attCal: { label: string; style: string }[] = [];
  for (let i = 0; i < attBlanks; i++) attCal.push({ label: "", style: "height:38px" });
  for (let d = 1; d <= daysInMonth; d++) {
    const st = ATT[d];
    const base = "height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-variant-numeric:tabular-nums;";
    const skin =
      st === "p"
        ? `background:${accent}1A;color:#171717;font-weight:600`
        : st === "l"
          ? "background:rgba(23,23,23,0.28);color:#fff;font-weight:600"
          : st === "a"
            ? "background:rgba(23,23,23,0.1);color:#4A4A46;font-weight:600"
            : "background:#F7F6F3;color:#6F6F6B";
    attCal.push({ label: String(d), style: base + skin });
  }

  // ---- trend (monthly average grade, like the parent portal) ----------------------------
  const buckets = new Map<string, { y: number; m: number; total: number; count: number }>();
  for (const g of data.grades) {
    const p = parts(g.createdAt);
    const key = `${p.y}-${p.m}`;
    const b = buckets.get(key) ?? { y: p.y, m: p.m, total: 0, count: 0 };
    b.total += g.pct;
    b.count += 1;
    buckets.set(key, b);
  }
  const trendMonths = [...buckets.values()].sort((a, b) => a.y - b.y || a.m - b.m).slice(-6);
  const TREND = trendMonths.map((b) => Math.round(b.total / b.count));
  const hasTrend = TREND.length >= 2;
  const w = 420, h = 150, pad = 6;
  const min = hasTrend ? Math.min(...TREND) - 8 : 0;
  const max = hasTrend ? Math.max(...TREND) + 6 : 1;
  const pts = hasTrend
    ? TREND.map((v, i) => [(i / (TREND.length - 1)) * (w - pad * 2) + pad, h - ((v - min) / (max - min)) * (h - pad * 2) - pad] as const)
    : [];
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const trendDelta = hasTrend ? TREND[TREND.length - 1] - TREND[0] : 0;

  // ---- next lesson ------------------------------------------------------------------------
  const lesson = data.upcomingLessons[0] ?? null;
  const lessonStart = lesson ? parts(lesson.date) : null;
  const lessonEnd = lesson ? parts(new Date(lesson.date).getTime() + lesson.minutes * 60000) : null;

  // ---- badges / achievements ---------------------------------------------------------------
  const earnedBadges = data.badges.filter((b) => b.earnedAt).sort((a, b) => (b.earnedAt as string).localeCompare(a.earnedAt as string));
  const lockedBadges = data.badges.filter((b) => !b.earnedAt);
  type Ach = { name: string; meta: string; icon: string; hot: boolean; locked: boolean; emoji?: string };
  const achList: Ach[] = [
    ...earnedBadges.map((b, i) => ({ name: b.name, meta: dayMonth(parts(b.earnedAt as string)), icon: BADGE_ICONS[b.code] ?? "", emoji: b.emoji, hot: i === 0, locked: false })),
  ];
  if (student.streakDays >= 7) achList.splice(Math.min(1, achList.length), 0, { name: `${student.streakDays} günlük seriya`, meta: "Aktiv", icon: "fa-solid fa-fire", hot: true, locked: false });
  achList.push(...lockedBadges.map((b) => ({ name: b.name, meta: "Kilidli", icon: BADGE_ICONS[b.code] ?? "", emoji: b.emoji, hot: false, locked: true })));

  // ---- verbatim style helpers from the file ----------------------------------------------------
  const navData: [Route, string, string, string][] = [
    ["/student", "Ana", "fa-solid fa-house", ""],
    ["/student/progress", "İnkişaf", "fa-solid fa-chart-simple", ""],
    ["/student/attendance", "Davamiyyət", "fa-solid fa-calendar-check", ""],
    ["/student/homework", "Tapşırıq", "fa-solid fa-book-open", active.length ? String(active.length) : ""],
    ["/student/settings", "Profil", "fa-solid fa-user", ""],
    ["/student/portfolio", "Layihələr", "fa-solid fa-folder-tree", ""],
    ["/student/leaderboard", "Reytinq", "fa-solid fa-ranking-star", ""],
  ];

  const navItems = navData.map(([href, label, icon, badge]) => {
    const isActive = nav === href;
    return {
      label,
      icon,
      badge,
      style: [
        "display:flex;align-items:center;gap:12px;width:100%;padding:11px 13px;border-radius:14px;cursor:pointer",
        "font-size:13.5px;font-weight:500;letter-spacing:-0.005em;text-align:left",
        "transition:background 0.18s ease,color 0.18s ease",
        isActive ? `background:${accent}17;color:#171717;border:1px solid ${accent}2E;font-weight:600` : "background:transparent;color:#6F6F6B;border:1px solid transparent",
      ].join(";"),
      badgeStyle: badge
        ? `min-width:19px;height:19px;padding:0 6px;border-radius:999px;background:${isActive ? accent : "rgba(23,23,23,0.08)"};color:${isActive ? "#fff" : "#4A4A46"};font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center`
        : "display:none",
      onGo: () => act.go(href),
    };
  });

  const bar = (pct: number) => `height:100%;width:${lit ? pct : 0}%;border-radius:999px;background:${accent};transition:width 1.05s cubic-bezier(0.22,1,0.36,1)`;
  const ring = (pct: number) => (lit ? (326.7 * (1 - pct / 100)).toFixed(1) : 326.7);

  const seg = (isActive: boolean) =>
    [
      "padding:9px 16px;border-radius:11px;border:none;cursor:pointer;font-size:12.5px;font-weight:600;letter-spacing:-0.005em",
      "transition:background 0.2s ease,color 0.2s ease,box-shadow 0.2s ease",
      isActive ? "background:#fff;color:#171717;box-shadow:0 2px 8px -4px rgba(23,23,23,0.3)" : "background:transparent;color:#6F6F6B",
    ].join(";");

  const chip = (tone: Tone) =>
    [
      "padding:6px 12px;border-radius:9px;font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0",
      tone === "due" ? `background:${accent}14;color:${accentText}` : tone === "done" ? "background:#F0EFEB;color:#4A4A46" : "background:#F2F2EF;color:#6F6F6B",
    ].join(";");

  const medal = (a: Ach) =>
    [
      "width:38px;height:38px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0",
      a.locked
        ? "background:#F7F6F3;color:#A8A8A2;border:1px dashed rgba(23,23,23,0.14)"
        : a.hot
          ? `background:${accent}14;color:${accentText};border:1px solid ${accent}2E`
          : "background:linear-gradient(145deg,#F2F0EB,#E4E1DA);color:#4A4A46;border:1px solid rgba(23,23,23,0.05)",
    ].join(";");

  const achData = achList.map((a) => ({
    name: a.name,
    meta: a.meta,
    icon: a.icon,
    medalStyle: medal(a),
    nameStyle: `font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${a.locked ? "#A8A8A2" : "#171717"}`,
  }));

  const projData = data.projects.map((p, i) => {
    const [from, to] = PROJECT_ART[i % PROJECT_ART.length];
    const pct = 100; // a portfolio entry is a finished project (Project has no progress field)
    const icon = PROJECT_ICONS[p.courseTag] ?? "fa-solid fa-cube";
    const art = p.imageUrl ? `background:url("${p.imageUrl}") center/cover no-repeat,linear-gradient(140deg,${from},${to})` : `background:linear-gradient(140deg,${from},${to})`;
    return {
      name: p.title,
      tech: p.technologies.join(" · ") || p.courseTag,
      status: "Tamamlandı",
      icon,
      pctLabel: `${pct}%`,
      barStyle: bar(pct),
      artStyle: `height:132px;display:flex;align-items:center;justify-content:center;${art};position:relative`,
      iconStyle: p.imageUrl ? "display:none" : `font-size:30px;color:${pct === 100 ? accent : "rgba(255,255,255,0.5)"}`,
      chipArtStyle: `width:40px;height:40px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;${art};color:${pct === 100 ? accent : "rgba(255,255,255,0.6)"}${p.imageUrl ? ";color:transparent" : ""}`,
      statusStyle: `font-size:12px;font-weight:600;color:${pct === 100 ? accentText : "#6F6F6B"}`,
    };
  });

  const streakDone = Math.min(student.streakDays, 7);
  const streakData = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"].map((day, i) => {
    const done = i < streakDone;
    return {
      day,
      icon: done ? "fa-solid fa-check" : "fa-solid fa-circle",
      cellStyle: [
        "height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center",
        done ? `background:${accent}1A;color:${accentText}` : `background:#fff;color:${accent};border:1px solid ${accent}44`,
      ].join(";"),
      pipStyle: `flex:1;height:5px;border-radius:999px;background:${done ? accent : accent + "33"}`,
    };
  });

  // ---- activity ----------------------------------------------------------------------------------
  const events: { at: string; what: string; xp: string }[] = [
    ...data.submissions
      .filter((s) => s.submittedAt)
      .map((s) => ({
        at: s.submittedAt as string,
        what: s.status === "GRADED" && s.score !== null ? `${s.title} — ${s.score} bal` : `${s.title} təhvil verildi`,
        xp: s.status === "GRADED" ? `+${XP_RULES.homework} XP` : "",
      })),
    ...earnedBadges.map((b) => ({ at: b.earnedAt as string, what: `${b.name} açıldı`, xp: "" })),
    ...data.projects.map((p) => ({ at: p.createdAt, what: `${p.title} layihəsi tamamlandı`, xp: `+${XP_RULES.project} XP` })),
    ...data.notes.map((n) => ({ at: n.createdAt, what: `Müəllim qeydi (${n.teacherName}): ${n.body}`, xp: "" })),
  ]
    .filter((e) => new Date(e.at).getTime() <= data.now)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);

  // ---- leaderboard (top rows; the signed-in student appended with the real rank when outside) ----
  const rows = data.leaderboard.map((r, i) => ({ ...r, rank: i + 1, me: r.id === student.id }));
  if (!rows.some((r) => r.me)) {
    rows.push({ id: student.id, name: fullName, courseName: course?.name ?? null, level: student.level, points: student.points, avatarUrl: student.avatarUrl, rank: data.myRank, me: true });
  }

  const titles: Record<string, [string, string]> = {
    "/student/progress": ["İnkişafın", "Fənlər üzrə irəliləyiş və XP artımı."],
    "/student/attendance": ["Davamiyyət", "Bu ay dərslərdə iştirakın."],
    "/student/homework": ["Tapşırıqlar", "Aktiv və tamamlanmış işlər."],
    "/student/portfolio": ["Layihələrim", "Qurduğun layihələr və irəliləyiş."],
    "/student/leaderboard": ["Reytinq", "Qrupundaki yerin."],
    "/student/settings": ["Profil", "Səviyyə, XP və nailiyyətlər."],
  };
  const mTitles: Record<MobileKey, [string, string]> = {
    home: greeting,
    progress: ["İnkişaf", "Fənlər üzrə irəliləyiş."],
    attendance: ["Davamiyyət", "Bu ay dərslərdə iştirakın."],
    homework: ["Tapşırıq", "Aktiv və tamamlanmış işlər."],
    settings: ["Profil", "Səviyyə və nailiyyətlər."],
  };

  const levelLabel = `Səviyyə ${student.level}`;
  const studentMeta = `${ageOf(student.birthDate, now)} yaş · ${course?.name ?? "Kurs seçilməyib"}`;

  return {
    pageTitle: titles[nav] ? titles[nav][0] : greeting[0],
    pageSub: titles[nav] ? titles[nav][1] : greeting[1],
    navItems,
    levelLabel,
    levelPctLabel: `${levelPct}%`,
    levelBar: bar(levelPct),
    xpProgressLabel: `${groupNumber(student.xp)} / ${groupNumber(target)} XP`,
    studentInitials: initialsOf(fullName),
    studentAvatar0: avatar(AVATAR_BASES.studentAvatar0, student.avatarUrl),
    studentAvatar1: avatar(AVATAR_BASES.studentAvatar1, student.avatarUrl),
    studentAvatar2: avatar(AVATAR_BASES.studentAvatar2, student.avatarUrl),
    studentAvatar3: avatar(AVATAR_BASES.studentAvatar3, student.avatarUrl),
    studentAvatar4: avatar(AVATAR_BASES.studentAvatar4, student.avatarUrl),
    studentAvatar5: avatar(AVATAR_BASES.studentAvatar5, student.avatarUrl),
    studentName: fullName,
    studentMeta,
    levelTitle: title,
    unreadDotStyle: data.unreadNotifications > 0 ? "position:absolute;top:9px;right:10px;width:6px;height:6px;border-radius:50%;background:#FF6B00;border:1.5px solid #fff" : "display:none",
    onLogout: act.logout,

    atHome: nav === "/student",
    atProgress: nav === "/student/progress",
    atLessons: nav === "/student/attendance",
    atTasks: nav === "/student/homework",
    atPortfolio: nav === "/student/portfolio",
    atLeaderboard: nav === "/student/leaderboard",
    atProfile: nav === "/student/settings",

    hasNextLesson: !!lesson,
    noNextLesson: !lesson,
    lessonTitle: lesson?.title ?? "",
    lessonWhen: lesson && lessonStart && lessonEnd ? `${relativeDay(lessonStart, now)} · ${clock(lessonStart)} — ${clock(lessonEnd)}` : "",
    lessonTeacherInitials: lesson ? initialsOf(lesson.teacherName) : "",
    lessonTeacherAvatar: avatar(AVATAR_BASES.lessonTeacherAvatar, lesson?.teacherPhotoUrl),
    lessonTeacher: lesson?.teacherName ?? "",
    lessonTeacherRole: lesson?.teacherPosition ?? "",
    onGoLesson: () => act.goLesson(lesson?.link ?? null),

    hasTask: !!todaysTask,
    noTask: !todaysTask,
    taskTitle: todaysTask?.title ?? "",
    taskDue: todaysTask ? (todaysTask.status === "OVERDUE" ? "Gecikib" : `${relativeDay(parts(todaysTask.dueDate), now)} təhvil`) : "",
    taskStatus: todaysTask ? statusOf(todaysTask, toneOf(todaysTask)) : "",
    taskPctLabel: "0%",
    taskBar: bar(0),
    taskXp: `+${XP_RULES.homework} XP`,
    onStartTask: () => act.startTask(todaysTask?.id ?? null),

    hasCourse: !!course,
    courseName: course?.name ?? "",
    courseModuleLabel: course
      ? moduleCount
        ? `Modul ${currentModule} / ${moduleCount} · ${course.modules[currentModule - 1]?.title ?? ""}`
        : `${course.durationMonths} ay · həftədə ${course.lessonsPerWeek} dərs`
      : "",
    courseModuleShort: moduleCount ? `Modul ${currentModule} / ${moduleCount}` : course ? `${course.durationMonths} ay · həftədə ${course.lessonsPerWeek} dərs` : "",
    coursePctLabel: `${overall}% tamamlanıb`,
    courseLeftLabel: moduleCount ? `${moduleCount - currentModule} modul qalıb` : "",
    courseBar: bar(overall),
    onContinue: () => act.continueCourse(course?.slug ?? null),

    xpDisplay: groupNumber(xp),
    xpMonthLabel: `+${xpThisMonth} bu ay`,
    nextLevelLabel: `Səviyyə ${dative(student.level + 1)} ${groupNumber(Math.max(0, target - student.xp))} XP qalıb`,
    xpSources: [
      { label: "Ev tapşırığı", xp: `+${XP_RULES.homework} XP`, icon: "fa-solid fa-book-open" },
      { label: "Layihə", xp: `+${XP_RULES.project} XP`, icon: "fa-solid fa-cube" },
      { label: "Mükəmməl quiz", xp: `+${XP_RULES.quiz} XP`, icon: "fa-solid fa-star" },
    ],
    levelNumber: String(student.level),
    levelOffset: ring(levelPct),
    streakDays: String(student.streakDays),
    streakLabel: `${student.streakDays} günlük seriya`,
    streak: streakData,

    hasRecommendation: !!course && !!nextModule,
    recoIntro: bestSubject ? `${bestSubject.name} mövzusunda yaxşı nəticə göstərmisən.` : "Növbəti modula keçməyə hazırsan.",
    recoTitle: nextModule?.title ?? "",
    recoDuration: course ? `Təxmini ${course.lessonMinutes} dəqiqə` : "",
    recoXp: `+${XP_RULES.quiz} XP`,
    onReco: () => act.continueCourse(course?.slug ?? null),

    projectsCountLabel: `${data.projects.length} layihə`,
    projects: projData,
    noProjects: projData.length === 0,
    achievements: achData,
    achievementsTop: achData.slice(0, 3),
    noAchievements: achData.length === 0,
    activity: events.map((e, i) => ({
      when: relativeDay(parts(e.at), now),
      what: e.what,
      xp: e.xp,
      dotStyle: `width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:7px;background:${i === 0 ? accent : "rgba(23,23,23,0.16)"}`,
      xpStyle: e.xp ? `font-size:12.5px;font-weight:600;color:${accentText};flex-shrink:0` : "display:none",
    })),
    noActivity: events.length === 0,
    hasChallenge: false, // no daily-challenge source in the backend yet — the card stays in the template, hidden

    overallPct: overall,
    overallOffset: ring(overall),
    overallNote: !data.subjects.length ? "Hələ irəliləyiş qeydi yoxdur." : overall >= 80 ? "Əla gedirsən — davam et." : overall >= 50 ? "Yaxşı gedirsən — davam et." : "Yaxşı başlanğıcdır — davam et.",
    subjects: data.subjects.map((s) => ({ name: s.name, pctLabel: `${s.pct}%`, barStyle: bar(s.pct) })),
    chartTitle: hasTrend ? "Nəticə artımı" : "Nəticələr",
    chartRange: hasTrend ? `${MONTHS[trendMonths[0].m]} — ${MONTHS[trendMonths[trendMonths.length - 1].m]}` : trendMonths.length === 1 ? MONTHS[trendMonths[0].m] : "Hələ qiymət yoxdur",
    chartDelta: hasTrend ? `${trendDelta >= 0 ? "+" : ""}${trendDelta}%` : trendMonths.length === 1 ? `${TREND[0]}%` : "—",
    hasTrend,
    noTrend: !hasTrend,
    chartLine: line,
    chartArea: hasTrend ? `${line} L${pts[pts.length - 1][0].toFixed(1)} ${h} L${pts[0][0].toFixed(1)} ${h} Z` : "",
    chartDots: pts.map(([x, y], i) => ({
      x: x.toFixed(1),
      y: y.toFixed(1),
      r: i === pts.length - 1 ? 4.5 : 2.6,
      sw: i === pts.length - 1 ? 2.5 : 1.6,
    })),
    chartLabels: trendMonths.map((b) => MONTHS_SHORT[b.m]),

    attendancePct,
    attendanceOffset: ring(attendancePct),
    attendanceStanding: !attDated.length ? "Hələ dərs qeydi yoxdur" : attendancePct >= 90 ? "Əla davamiyyət" : attendancePct >= 75 ? "Yaxşı davamiyyət" : "Davamiyyət diqqət tələb edir",
    attMonthSummary: monthRecords.length
      ? `${MONTHS[attMonth.m]} ayında ${monthRecords.length} dərsdən ${locativePossessive(attended)} iştirak etmisən.`
      : `${MONTHS[attMonth.m]} ayında hələ dərs qeydə alınmayıb.`,
    attMonthSummaryShort: monthRecords.length ? `${monthLocative(attMonth.m)} ${monthRecords.length} dərsdən ${possessive(attended)}.` : `${monthLocative(attMonth.m)} dərs yoxdur.`,
    attMonthName: MONTHS[attMonth.m],
    attTiles: [
      { v: String(monthCounts.present), k: "İştirak" },
      { v: String(monthCounts.late), k: "Gecikmə" },
      { v: String(monthCounts.absent), k: "Qayıb" },
    ],
    weekDays: ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"],
    attCalendar: attCal,
    lessons: data.upcomingLessons.map((l, i) => {
      const p = parts(l.date);
      const isNow = dayDiff(now, p) === 0;
      return {
        course: l.title,
        teacher: l.teacherName,
        day: dayDiff(now, p) <= 1 ? relativeDay(p, now) : WEEKDAYS_LONG[p.wd],
        dayShort: WEEKDAYS_TILE[p.wd],
        time: clock(p),
        rowStyle: `display:flex;align-items:center;gap:16px;padding:20px 30px;${i ? "border-top:1px solid rgba(23,23,23,0.055)" : ""}`,
        dayStyle: [
          "width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0",
          "font-size:11px;font-weight:700;letter-spacing:0.04em",
          isNow ? `background:${accent}14;color:${accentText}` : "background:#F2F2EF;color:#6F6F6B",
        ].join(";"),
        timeStyle: `font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;color:${isNow ? accentText : "#171717"}`,
      };
    }),
    noLessons: data.upcomingLessons.length === 0,

    hwTabs: (["Hamısı", "Aktiv", "Tamamlandı"] as HwFilter[]).map((label) => ({
      label,
      style: seg(hwFilter === label),
      onGo: () => act.setHwFilter(label),
    })),
    hwList: hwVisible.map((x, i) => ({
      title: x.s.title,
      subject: x.s.courseName,
      due: dueOf(x.s),
      status: statusOf(x.s, x.tone),
      rowStyle: `display:flex;align-items:center;gap:16px;padding:20px 30px;${i ? "border-top:1px solid rgba(23,23,23,0.055)" : ""}`,
      icon: x.tone === "done" ? "fa-solid fa-check" : "fa-solid fa-file-lines",
      iconStyle: [
        "width:38px;height:38px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0",
        x.tone === "due" ? `background:${accent}14;color:${accentText}` : "background:#F2F2EF;color:#4A4A46",
      ].join(";"),
      chipStyle: chip(x.tone),
      canSubmit: x.s.status === "PENDING" || x.s.status === "OVERDUE",
      onSubmit: () => act.submitHomework(x.s.id),
    })),
    hwEmpty: hwVisible.length === 0,

    enrollments: data.courses.map((c) => c.name),
    skills: data.subjects.map((s) => ({ name: s.name, pctLabel: `${s.pct}%`, barStyle: bar(s.pct) })),
    leaderboard: rows.map((s, i) => ({
      rank: String(s.rank),
      name: s.me ? `${s.name} (sən)` : s.name,
      initials: initialsOf(s.name),
      meta: `${s.courseName ?? "Kurs seçilməyib"} · Səviyyə ${s.level}`,
      points: groupNumber(s.points),
      rowStyle: ["display:flex;align-items:center;gap:16px;padding:18px 26px", i ? "border-top:1px solid rgba(23,23,23,0.055)" : "", s.me ? `background:${accent}0D` : ""]
        .filter(Boolean)
        .join(";"),
      rankStyle: [
        "width:28px;height:28px;flex-shrink:0;border-radius:9px;display:flex;align-items:center;justify-content:center",
        "font-size:12.5px;font-weight:700;font-variant-numeric:tabular-nums",
        s.rank <= 3 ? `background:${accent}14;color:${accentText}` : "background:transparent;color:#6F6F6B",
      ].join(";"),
      avatarStyle: avatar(
        [
          "width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center",
          "font-family:'Plus Jakarta Sans',sans-serif;font-size:12.5px;font-weight:600",
          s.me ? `background:${accent}1A;color:${accentText}` : "background:#E9E7E2;color:#4A4A46",
        ].join(";"),
        s.avatarUrl
      ),
      nameStyle: `font-size:14.5px;font-weight:600;letter-spacing:-0.008em;color:${s.me ? accentText : "#171717"}`,
    })),
    profileStats: [
      { k: "Səviyyə", v: String(student.level) },
      { k: "XP", v: groupNumber(student.xp) },
      { k: "Nailiyyət", v: String(earnedBadges.length) },
      { k: "Layihə", v: String(data.projects.length) },
    ],
    onChangeAvatar: act.changeAvatar,

    mAtHome: mnav === "home",
    mAtProgress: mnav === "progress",
    mAtLessons: mnav === "attendance",
    mAtTasks: mnav === "homework",
    mAtProfile: mnav === "settings",
    mTitle: mTitles[mnav][0],
    mSub: mTitles[mnav][1],
    mobileNav: (
      [
        ["home", "Ana", "fa-solid fa-house"],
        ["progress", "İnkişaf", "fa-solid fa-chart-simple"],
        ["attendance", "Davamiyyət", "fa-solid fa-calendar-check"],
        ["homework", "Tapşırıq", "fa-solid fa-book-open"],
        ["settings", "Profil", "fa-solid fa-user"],
      ] as [MobileKey, string, string][]
    ).map(([key, label, icon]) => {
      const isActive = mnav === key;
      return {
        label,
        icon,
        style: [
          "flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;padding:10px 4px 8px 4px;cursor:pointer",
          "background:transparent;border:none;border-radius:14px",
          "transition:color 0.2s ease",
          isActive ? `color:${accent}` : "color:#6F6F6B",
        ].join(";"),
        labelStyle: ["font-size:9.5px;letter-spacing:0.01em", "transition:color 0.2s ease", isActive ? "font-weight:700;color:#171717" : "font-weight:600"].join(";"),
        dotStyle: [
          "width:4px;height:4px;border-radius:50%;margin-top:1px",
          "transition:opacity 0.2s ease,transform 0.2s ease",
          isActive ? `background:${accent};opacity:1;transform:scale(1)` : "background:transparent;opacity:0;transform:scale(0.6)",
        ].join(";"),
        onGo: () => act.goMobile(key),
      };
    }),
  };
}
