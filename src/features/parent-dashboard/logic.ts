// Port of parent-dashboard.html's `renderVals()`: the same style builders
// (seg, chip, listRow, bar, calendar, chart maths, nav/tab/toggle styles) with
// the prototype's demo arrays replaced by the parent's real data.
import {
  MONTHS,
  MONTHS_SHORT,
  clock,
  countWord,
  dayDiff,
  dayMonth,
  dayMonthShort,
  dayMonthShortYear,
  groupNumber,
  initialsOf,
  locativePossessive,
  longDate,
  monthLocative,
  ordinal,
  parts,
  possessive,
  type Parts,
} from "./az";
import { AVATAR_BASES } from "./avatar-bases.generated";
import type { NotificationPrefs, PortalChild, PortalData, PortalSubmission } from "./types";
import type { TemplateVals } from "./vals";

export const ACCENT = "#FF6B00";

export const HOME = "/parent";
export const ROUTES = ["/parent", "/parent/children", "/parent/attendance", "/parent/homework", "/parent/notifications", "/parent/settings"] as const;
export type Route = (typeof ROUTES)[number];

export type MobileKey = "home" | "progress" | "att" | "hw" | "me";
export type HwFilter = "Hamısı" | "Aktiv" | "Tamamlandı";
export type Lang = "AZ" | "EN";

export type UiState = {
  nav: Route;
  mnav: MobileKey;
  lit: boolean;
  childIndex: number;
  /** "y-m" key of the attendance month tab; null = current month */
  month: string | null;
  hwFilter: HwFilter;
  lang: Lang;
  notif: NotificationPrefs;
};

export type Actions = {
  go: (href: Route) => void;
  goMobile: (key: MobileKey) => void;
  setMonth: (key: string) => void;
  setHwFilter: (f: HwFilter) => void;
  setLang: (l: Lang) => void;
  toggleNotif: (key: keyof NotificationPrefs) => void;
  switchChild: () => void;
  selectChild: (index: number, href: Route) => void;
  logout: () => void;
  goLesson: (link: string | null) => void;
  markAllRead: () => void;
  openNotification: (id: string) => void;
  saveProfile: () => void;
  cancelProfile: () => void;
  changeAvatar: () => void;
};

/** Maps a pathname to the mobile tab that shows the same content. */
export function mobileKeyForRoute(nav: string): MobileKey {
  if (nav === "/parent/attendance") return "att";
  if (nav === "/parent/homework") return "hw";
  if (nav === "/parent/settings" || nav === "/parent/children") return "me";
  return "home";
}

export function routeForMobileKey(key: MobileKey): Route {
  return key === "att" ? "/parent/attendance" : key === "hw" ? "/parent/homework" : key === "me" ? "/parent/settings" : "/parent";
}

export function monthKey(p: Parts) {
  return `${p.y}-${p.m}`;
}

type Tone = "due" | "open" | "done";

const HW_STATUS_LABEL: Record<PortalSubmission["status"], string> = {
  PENDING: "Aktiv",
  OVERDUE: "Gecikib",
  SUBMITTED: "Təhvil verilib",
  GRADED: "Tamamlandı",
};
const HW_ORDER: PortalSubmission["status"][] = ["OVERDUE", "PENDING", "SUBMITTED", "GRADED"];

const BADGE_ICONS: Record<string, string> = {
  "cyber-defender": "fa-solid fa-shield-halved",
  "python-master": "fa-solid fa-code",
  "first-project": "fa-solid fa-cube",
  "robot-builder": "fa-solid fa-robot",
  "competition-winner": "fa-solid fa-trophy",
  "streak-10": "fa-solid fa-fire",
};

function notificationIcon(n: { type: string; title: string }) {
  const t = n.title.toLowerCase();
  if (t.includes("dərs")) return "fa-solid fa-calendar-check";
  if (t.includes("ödəniş")) return "fa-solid fa-credit-card";
  if (t.includes("nailiyyət")) return "fa-solid fa-shield-halved";
  if (t.includes("qeyd")) return "fa-solid fa-comment-dots";
  if (t.includes("tapşırı") || t.includes("qiymət")) return "fa-solid fa-star";
  return n.type === "success"
    ? "fa-solid fa-star"
    : n.type === "warning"
      ? "fa-solid fa-triangle-exclamation"
      : n.type === "error"
        ? "fa-solid fa-circle-exclamation"
        : "fa-solid fa-circle-info";
}

/** The file's avatar circle, filled with a real photo when one exists (initials stay for a11y, hidden). */
function avatar(base: string, url: string | null | undefined) {
  return url ? `${base};background-image:url("${url}");background-size:cover;background-position:center;color:transparent` : base;
}

function ageOf(birthDate: string, now: Parts) {
  const b = parts(birthDate);
  let age = now.y - b.y;
  if (now.m < b.m || (now.m === b.m && now.d < b.d)) age -= 1;
  return Math.max(age, 0);
}

function avg(values: number[]) {
  return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
}

function attendanceCounts(records: PortalChild["attendance"]) {
  const c = { present: 0, late: 0, absent: 0 };
  for (const r of records) {
    if (r.status === "PRESENT") c.present += 1;
    else if (r.status === "LATE") c.late += 1;
    else c.absent += 1;
  }
  return c;
}

function attendancePctOf(records: PortalChild["attendance"]) {
  if (!records.length) return 0;
  const c = attendanceCounts(records);
  return Math.round(((c.present + c.late) / records.length) * 100);
}

function standingFor(pct: number, hasRecords: boolean) {
  if (!hasRecords) return "Hələ dərs qeydi yoxdur";
  if (pct >= 90) return "Əla davamiyyət";
  if (pct >= 75) return "Yaxşı davamiyyət";
  return "Davamiyyət diqqət tələb edir";
}

function homeworkTone(s: PortalSubmission, now: Parts): Tone {
  if (s.status === "SUBMITTED" || s.status === "GRADED") return "done";
  if (s.status === "OVERDUE") return "due";
  return dayDiff(now, parts(s.dueDate)) <= 1 ? "due" : "open";
}

function sortHomework(list: PortalSubmission[]) {
  return [...list].sort((a, b) => {
    const byStatus = HW_ORDER.indexOf(a.status) - HW_ORDER.indexOf(b.status);
    if (byStatus) return byStatus;
    const done = a.status === "SUBMITTED" || a.status === "GRADED";
    // active work: soonest deadline first; finished work: most recent first
    return done ? b.dueDate.localeCompare(a.dueDate) : a.dueDate.localeCompare(b.dueDate);
  });
}

export function buildVals(data: PortalData, state: UiState, act: Actions): TemplateVals {
  const accent = ACCENT;
  const { nav, mnav, lit, hwFilter, lang, notif } = state;
  const now = parts(data.now);
  const childIndex = Math.min(state.childIndex, Math.max(data.children.length - 1, 0));
  const child: PortalChild | null = data.children[childIndex] ?? null;
  const first = child?.firstName ?? "";
  const parentFirst = data.parent.name.trim().split(/\s+/)[0] ?? "";

  const greeting = now.h < 12 ? `Sabahınız xeyir, ${parentFirst}.` : now.h < 18 ? `Salam, ${parentFirst}.` : `Axşamınız xeyir, ${parentFirst}.`;

  // ---- attendance -----------------------------------------------------------
  const att = child?.attendance ?? [];
  const attAll = attendanceCounts(att);
  const attendancePct = attendancePctOf(att);
  const attDated = att.map((r) => ({ ...r, p: parts(r.date) }));

  const monthTabKeys: { key: string; y: number; m: number }[] = [];
  for (let back = 2; back >= 0; back--) {
    const d = new Date(Date.UTC(now.y, now.m - back, 1));
    monthTabKeys.push({ key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, y: d.getUTCFullYear(), m: d.getUTCMonth() });
  }
  const currentKey = monthKey(now);
  const inMonth = (t: { y: number; m: number }) => attDated.filter((r) => r.p.y === t.y && r.p.m === t.m);
  // default tab: the latest of the three months that has lessons recorded (else the current month)
  const defaultTab = [...monthTabKeys].reverse().find((t) => inMonth(t).length > 0) ?? monthTabKeys[monthTabKeys.length - 1];
  const selected = monthTabKeys.find((t) => t.key === state.month) ?? defaultTab;
  const selectedRecords = inMonth(selected);
  const currentRecords = inMonth({ y: now.y, m: now.m });
  const selCounts = attendanceCounts(selectedRecords);
  const curCounts = attendanceCounts(currentRecords);
  const monthSentence = (records: typeof selectedRecords, counts: ReturnType<typeof attendanceCounts>) =>
    records.length ? `${records.length} dərsdən ${locativePossessive(counts.present + counts.late)}` : null;

  // Monday-first grid: JS getDay() is Sunday-first, so shift by 6
  const blanks = (new Date(Date.UTC(selected.y, selected.m, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(selected.y, selected.m + 1, 0)).getUTCDate();
  const ATT_MAP: Record<number, "p" | "l" | "a"> = {};
  const rank = { p: 0, l: 1, a: 2 };
  for (const r of selectedRecords) {
    const st: "p" | "l" | "a" = r.status === "PRESENT" ? "p" : r.status === "LATE" ? "l" : "a";
    const prev = ATT_MAP[r.p.d];
    if (!prev || rank[st] > rank[prev]) ATT_MAP[r.p.d] = st;
  }
  const cal: { label: string; style: string }[] = [];
  for (let i = 0; i < blanks; i++) cal.push({ label: "", style: "height:38px" });
  for (let d = 1; d <= daysInMonth; d++) {
    const st = ATT_MAP[d];
    const base = "height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-variant-numeric:tabular-nums;transition:transform 0.16s ease;";
    const skin =
      st === "p"
        ? `background:${accent}1A;color:#171717;font-weight:600`
        : st === "l"
          ? "background:rgba(23,23,23,0.28);color:#fff;font-weight:600"
          : st === "a"
            ? "background:rgba(23,23,23,0.1);color:#4A4A46;font-weight:600"
            : "background:#F7F6F3;color:#6F6F6B";
    cal.push({ label: String(d), style: base + skin });
  }

  const lateDates = selectedRecords.filter((r) => r.status === "LATE").map((r) => dayMonth(r.p));
  const absentDates = selectedRecords.filter((r) => r.status === "ABSENT" || r.status === "EXCUSED").map((r) => dayMonth(r.p));
  const teacherNotes = selectedRecords.filter((r) => r.note).map((r) => `"${r.note}"`);
  const attNoteParts: string[] = [];
  if (lateDates.length) attNoteParts.push(`Gecikmə: ${lateDates.join(", ")}.`);
  if (absentDates.length) attNoteParts.push(`Qayıb: ${absentDates.join(", ")}.`);
  if (!lateDates.length && !absentDates.length) attNoteParts.push(selectedRecords.length ? "Bu ay gecikmə və qayıb qeydə alınmayıb." : "Bu ay üçün dərs qeydi yoxdur.");
  if (teacherNotes.length) attNoteParts.push(`Müəllim qeydi: ${teacherNotes.slice(0, 2).join(" ")}`);
  if (att.length) {
    attNoteParts.push(
      attendancePct >= 90 ? "Ümumi davamiyyət 90%-dən yuxarıdır." : attendancePct >= 75 ? `Ümumi davamiyyət ${attendancePct}% səviyyəsindədir.` : `Ümumi davamiyyət ${attendancePct}% — diqqət tələb edir.`
    );
  }

  // ---- homework --------------------------------------------------------------
  const submissions = sortHomework(child?.submissions ?? []);
  const activeCount = submissions.filter((s) => s.status === "PENDING" || s.status === "OVERDUE").length;
  const hwDue = (s: PortalSubmission, short: boolean) => {
    const due = parts(s.dueDate);
    if (s.status === "GRADED") return s.score !== null ? `${s.score} bal` : "Tamamlandı";
    if (s.status === "SUBMITTED") return short ? "Təhvil verilib" : "Yoxlanılır";
    if (s.status === "OVERDUE") return short ? "Gecikib" : dayMonth(due);
    const diff = dayDiff(now, due);
    if (diff <= 0) return "Bu günə qədər";
    if (diff === 1) return "Sabaha qədər";
    return short ? dayMonthShort(due) : dayMonth(due);
  };
  const HW = submissions.map((s) => ({ s, tone: homeworkTone(s, now) }));
  const hwVisible = hwFilter === "Aktiv" ? HW.filter((x) => x.tone !== "done") : hwFilter === "Tamamlandı" ? HW.filter((x) => x.tone === "done") : HW;

  // ---- progress / trend -------------------------------------------------------
  const subjects = child?.subjects ?? [];
  const progressPct = avg(subjects.map((s) => s.pct));
  const homeworkPct = child && child.submissions.length
    ? Math.round((child.submissions.filter((s) => s.status === "SUBMITTED" || s.status === "GRADED").length / child.submissions.length) * 100)
    : 0;

  const buckets = new Map<string, { y: number; m: number; total: number; count: number }>();
  for (const g of child?.grades ?? []) {
    const p = parts(g.createdAt);
    const key = monthKey(p);
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

  // ---- next lesson / teacher note ---------------------------------------------
  const lesson = child?.nextLesson ?? null;
  const lessonP = lesson ? parts(lesson.date) : null;
  const lessonDiff = lessonP ? dayDiff(now, lessonP) : 0;
  const lessonWhen = lessonP ? `${lessonDiff === 0 ? "Bugün" : lessonDiff === 1 ? "Sabah" : dayMonth(lessonP)} · ${clock(lessonP)}` : "";

  // The teacher-note card: the newest note the parent may read; graded feedback as a fallback.
  const latestNote = child?.notes[0] ?? null;
  const latestFeedback = [...(child?.submissions ?? [])]
    .filter((s) => s.feedback)
    .sort((a, b) => (b.submittedAt ?? b.dueDate).localeCompare(a.submittedAt ?? a.dueDate))[0];
  const note = latestNote
    ? { feedback: latestNote.body, teacherName: latestNote.teacherName, teacherPosition: latestNote.teacherPosition, teacherPhotoUrl: latestNote.teacherPhotoUrl, at: latestNote.createdAt }
    : latestFeedback
      ? { feedback: latestFeedback.feedback as string, teacherName: latestFeedback.teacherName, teacherPosition: latestFeedback.teacherPosition, teacherPhotoUrl: latestFeedback.teacherPhotoUrl, at: latestFeedback.submittedAt ?? latestFeedback.dueDate }
      : null;

  // ---- achievements / activity -------------------------------------------------
  const badges = [...(child?.badges ?? [])].sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
  const events: { at: string; what: string }[] = [
    ...(child?.submissions ?? [])
      .filter((s) => s.submittedAt)
      .map((s) => ({
        at: s.submittedAt as string,
        what: s.status === "GRADED" && s.score !== null ? `${s.title} — ${s.score} bal` : `${s.title} təhvil verildi`,
      })),
    ...badges.map((b) => ({ at: b.earnedAt, what: `${b.name} nailiyyəti açıldı` })),
    ...att.map((r) => ({
      at: r.date,
      what:
        r.status === "PRESENT"
          ? `${r.courseName} dərsində iştirak`
          : r.status === "LATE"
            ? `${r.courseName} dərsinə gecikmə`
            : r.status === "EXCUSED"
              ? `${r.courseName} dərsində icazəli qayıb`
              : `${r.courseName} dərsində qayıb`,
    })),
  ]
    .filter((e) => new Date(e.at).getTime() <= data.now)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4);
  const whenLabel = (isoDate: string) => {
    const diff = dayDiff(parts(isoDate), now);
    return diff === 0 ? "Bugün" : diff === 1 ? "Dünən" : dayMonth(parts(isoDate));
  };

  // ---- notifications --------------------------------------------------------------
  const unread = data.notifications.filter((n) => !n.read).length;
  const ago = (isoDate: string) => {
    const mins = Math.max(0, Math.floor((data.now - new Date(isoDate).getTime()) / 60000));
    if (mins < 60) return `${Math.max(mins, 1)} dəq`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat`;
    const days = dayDiff(parts(isoDate), now);
    if (days <= 1) return "Dünən";
    if (days < 7) return `${days} gün`;
    return dayMonthShort(parts(isoDate));
  };

  // ---- verbatim style helpers from the file -------------------------------------------
  const navData: [Route, string, string, string][] = [
    ["/parent", "Ana səhifə", "fa-solid fa-house", ""],
    ["/parent/children", "Övladlarım", "fa-solid fa-user-group", ""],
    ["/parent/attendance", "Davamiyyət", "fa-solid fa-calendar-check", ""],
    ["/parent/homework", "Ev tapşırığı", "fa-solid fa-book-open", activeCount ? String(activeCount) : ""],
    ["/parent/notifications", "Bildirişlər", "fa-solid fa-bell", unread ? String(unread) : ""],
    ["/parent/settings", "Tənzimləmələr", "fa-solid fa-gear", ""],
  ];

  const navItems = navData.map(([href, label, icon, badge]) => {
    const active = nav === href;
    return {
      label,
      icon,
      badge,
      style: [
        "display:flex;align-items:center;gap:12px;width:100%;padding:11px 13px;border-radius:14px;cursor:pointer",
        "font-size:13.5px;font-weight:500;letter-spacing:-0.005em;text-align:left",
        "transition:background 0.18s ease,color 0.18s ease,transform 0.18s ease",
        active ? `background:${accent}17;color:#171717;border:1px solid ${accent}2E;font-weight:600` : "background:transparent;color:#6F6F6B;border:1px solid transparent",
      ].join(";"),
      badgeStyle: badge
        ? `min-width:19px;height:19px;padding:0 6px;border-radius:999px;background:${active ? accent : "rgba(23,23,23,0.08)"};color:${active ? "#fff" : "#4A4A46"};font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center`
        : "display:none",
      onGo: () => act.go(href),
    };
  });

  const seg = (active: boolean) =>
    [
      "padding:9px 16px;border-radius:11px;border:none;cursor:pointer;font-size:12.5px;font-weight:600;letter-spacing:-0.005em",
      "transition:background 0.2s ease,color 0.2s ease,box-shadow 0.2s ease",
      active ? "background:#fff;color:#171717;box-shadow:0 2px 8px -4px rgba(23,23,23,0.3)" : "background:transparent;color:#6F6F6B",
    ].join(";");

  const chip = (tone: Tone) =>
    [
      "padding:6px 12px;border-radius:9px;font-size:11.5px;font-weight:600;white-space:nowrap;flex-shrink:0",
      tone === "due" ? `background:${accent}14;color:#E66000` : tone === "done" ? "background:#F0EFEB;color:#4A4A46" : "background:#F2F2EF;color:#6F6F6B",
    ].join(";");

  const listRow = (i: number, hover: boolean) =>
    ["display:flex;align-items:center;gap:16px;padding:20px 30px", i ? "border-top:1px solid rgba(23,23,23,0.055)" : "", hover ? "transition:background 0.18s ease" : ""]
      .filter(Boolean)
      .join(";");

  const bar = (pct: number) => `height:100%;width:${lit ? pct : 0}%;border-radius:999px;background:${accent};transition:width 1.05s cubic-bezier(0.22,1,0.36,1)`;

  const dotDate = "width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:7px;";

  const currentSentence = monthSentence(currentRecords, curCounts);
  const titles: Record<string, [string, string]> = {
    "/parent/children": ["Övladlarım", "Qeydiyyatda olan tələbələr və onların irəliləyişi."],
    "/parent/attendance": ["Davamiyyət", currentSentence ? `${first} bu ay ${currentSentence} iştirak edib.` : `${first} üçün bu ay hələ dərs qeydə alınmayıb.`],
    "/parent/homework": ["Ev tapşırığı", "Aktiv tapşırıqlar və təhvil tarixləri."],
    "/parent/notifications": ["Bildirişlər", "Məktəbdən gələn son yeniliklər."],
    "/parent/settings": ["Tənzimləmələr", "Profil, bildiriş və dil seçimləri."],
  };

  const mTitles: Record<MobileKey, [string, string]> = {
    home: [greeting, attendancePct >= 90 && progressPct >= 70 ? `${first} bu həftə əla gedir.` : `${first} bu həftə irəliləyir.`],
    progress: ["İnkişaf", "Fənlər üzrə irəliləyiş."],
    att: ["Davamiyyət", `${MONTHS[selected.m]} ayı üzrə iştirak.`],
    hw: ["Tapşırıq", "Aktiv və tamamlanmış işlər."],
    me: ["Profil", "Hesab və bildiriş tənzimləmələri."],
  };

  const selectedSentence = monthSentence(selectedRecords, selCounts);
  const childCourse = child?.courseName ?? "Kurs seçilməyib";
  const enrolledYears = child?.enrolledAt ? Math.floor(dayDiff(parts(child.enrolledAt), now) / 365.25) + 1 : 1;

  const parentAvatar = data.parent.avatarUrl;

  return {
    parentInitials: initialsOf(data.parent.name),
    parentAvatar0: avatar(AVATAR_BASES.parentAvatar0, parentAvatar),
    parentAvatar1: avatar(AVATAR_BASES.parentAvatar1, parentAvatar),
    parentAvatar2: avatar(AVATAR_BASES.parentAvatar2, parentAvatar),
    parentAvatar3: avatar(AVATAR_BASES.parentAvatar3, parentAvatar),
    parentAvatar4: avatar(AVATAR_BASES.parentAvatar4, parentAvatar),
    parentName: data.parent.name,
    parentEmail: data.parent.email,
    pageTitle: titles[nav] ? titles[nav][0] : greeting,
    pageSub: titles[nav] ? titles[nav][1] : child ? `${first} bu həftə necə irəliləyir.` : "Hələ qeydiyyatda olan övlad yoxdur.",
    today: longDate(now),
    navItems,
    onLogout: act.logout,

    atHome: nav === "/parent",
    atChildren: nav === "/parent/children",
    atAttendance: nav === "/parent/attendance",
    atHomework: nav === "/parent/homework",
    atNotifications: nav === "/parent/notifications",
    atSettings: nav === "/parent/settings",

    childInitials: child ? initialsOf(`${child.firstName} ${child.lastName}`) : "—",
    childAvatar: avatar(AVATAR_BASES.childAvatar, child?.avatarUrl),
    childName: child ? `${child.firstName} ${child.lastName}` : "Övlad qeydiyyatı yoxdur",
    childMeta: child ? `${ageOf(child.birthDate, now)} yaş · ${childCourse}` : "Məktəbə müraciət edin",
    childLevel: child ? `Səviyyə ${child.level}` : "—",
    childYear: child ? `${ordinal(enrolledYears)} il` : "—",
    onSwitchChild: act.switchChild,

    attendancePct,
    attendanceStanding: standingFor(attendancePct, att.length > 0),
    attendanceOffset: lit ? (326.7 * (1 - attendancePct / 100)).toFixed(1) : 326.7,
    attendanceRows: [
      { label: "İştirak", value: String(attAll.present), dotStyle: `width:7px;height:7px;border-radius:50%;background:${accent}` },
      { label: "Gecikmə", value: String(attAll.late), dotStyle: "width:7px;height:7px;border-radius:50%;background:rgba(23,23,23,0.22)" },
      { label: "Qayıb", value: String(attAll.absent), dotStyle: "width:7px;height:7px;border-radius:50%;background:rgba(23,23,23,0.1)" },
    ],
    minorStats: [
      { label: "Öyrənmə inkişafı", value: `${progressPct}%` },
      { label: "Ev tapşırığı", value: `${homeworkPct}%` },
      { label: "Bal", value: groupNumber(child?.points ?? 0) },
    ],
    progressSub: subjects.length ? `${first} cari fənlər üzrə sabit şəkildə irəliləyir.` : "Fənn üzrə irəliləyiş hələ qeydə alınmayıb.",
    subjects: subjects.map((s) => ({ name: s.name, pctLabel: `${s.pct}%`, barStyle: bar(s.pct) })),

    chartTitle: hasTrend ? `${countWord(TREND.length)} aylıq inkişaf` : "İnkişaf",
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

    hasNextLesson: !!lesson,
    noNextLesson: !lesson,
    lessonTitle: lesson?.title ?? "",
    lessonWhen,
    lessonDuration: lesson ? `${lesson.minutes} dəqiqə` : "",
    lessonDurationShort: lesson ? `${lesson.minutes} dəq` : "",
    lessonTeacherInitials: lesson ? initialsOf(lesson.teacherName) : "",
    lessonTeacherAvatar: avatar(AVATAR_BASES.lessonTeacherAvatar, lesson?.teacherPhotoUrl),
    lessonTeacher: lesson?.teacherName ?? "",
    lessonTeacherRole: lesson?.teacherPosition ?? "",
    onGoLesson: () => act.goLesson(lesson?.link ?? null),

    hasNote: !!note,
    noNote: !note,
    noteText: note?.feedback ?? "",
    noteTeacherInitials: note ? initialsOf(note.teacherName) : "",
    noteTeacherAvatar: avatar(AVATAR_BASES.noteTeacherAvatar, note?.teacherPhotoUrl),
    noteTeacher: note?.teacherName ?? "",
    noteTeacherRole: note?.teacherPosition ?? "",
    noteDate: note ? dayMonthShortYear(parts(note.at)) : "",

    homeworkActiveLabel: `${activeCount} aktiv`,
    hasHomework: activeCount > 0,
    noHomework: activeCount === 0,
    homework: HW.slice(0, 4).map((x, i) => ({
      title: x.s.title,
      meta: hwDue(x.s, true),
      rowStyle: `display:flex;align-items:center;gap:14px;padding:15px 0;${i ? "border-top:1px solid rgba(23,23,23,0.055)" : ""}`,
      dotStyle: `width:7px;height:7px;border-radius:50%;flex-shrink:0;background:${x.tone === "due" ? accent : x.tone === "open" ? "rgba(23,23,23,0.22)" : "rgba(23,23,23,0.1)"}`,
      metaStyle: `font-size:12.5px;font-weight:${x.tone === "due" ? 600 : 500};color:${x.tone === "due" ? "#171717" : "#6F6F6B"};white-space:nowrap`,
    })),

    hasAchievements: badges.length > 0,
    noAchievements: badges.length === 0,
    achievements: badges.slice(0, 3).map((b, i) => {
      const icon = BADGE_ICONS[b.code] ?? "";
      const hot = i === 0;
      return {
        name: b.name,
        date: `${parts(b.earnedAt).d} ${monthLocative(parts(b.earnedAt).m)} açıldı`,
        icon,
        iconText: icon ? "" : b.emoji,
        medalStyle: [
          "width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0",
          hot ? `background:${accent}14;color:#E66000;border:1px solid ${accent}2E` : "background:linear-gradient(145deg,#F2F0EB,#E4E1DA);color:#4A4A46;border:1px solid rgba(23,23,23,0.05)",
        ].join(";"),
      };
    }),

    activity: events.map((e, i) => ({
      when: whenLabel(e.at),
      what: e.what,
      dotStyle: dotDate + `background:${i === 0 ? accent : "rgba(23,23,23,0.16)"}`,
    })),

    children: data.children.map((c, i) => {
      const hot = i === childIndex;
      const pct = avg(c.subjects.map((s) => s.pct));
      const tag = c.enrollmentStatus === "active" ? "Aktiv" : c.enrollmentStatus === "paused" ? "Fasilə" : c.enrollmentStatus === "completed" ? "Tamamlanıb" : "Qeydiyyat yoxdur";
      return {
        name: `${c.firstName} ${c.lastName}`,
        initials: initialsOf(`${c.firstName} ${c.lastName}`),
        avatarCard: avatar(AVATAR_BASES.avatarCard, c.avatarUrl),
        avatarList: avatar(AVATAR_BASES.avatarList, c.avatarUrl),
        meta: `${ageOf(c.birthDate, now)} yaş · ${c.courseName ?? "Kurs seçilməyib"}`,
        tag,
        cardStyle: [
          "padding:30px;border-radius:26px;background:#fff;box-shadow:0 1px 2px rgba(23,23,23,0.03)",
          hot ? `border:1px solid ${accent}33` : "border:1px solid rgba(23,23,23,0.05)",
          "transition:transform 0.2s ease,box-shadow 0.2s ease",
        ].join(";"),
        tagStyle: `padding:6px 12px;border-radius:9px;font-size:11.5px;font-weight:600;flex-shrink:0;background:${hot ? accent + "14" : "#F2F2EF"};color:${hot ? "#E66000" : "#6F6F6B"}`,
        stats: [
          { v: `${attendancePctOf(c.attendance)}%`, k: "Davamiyyət" },
          { v: `${pct}%`, k: "İnkişaf" },
          { v: groupNumber(c.points), k: "Bal" },
        ],
        barStyle: bar(pct),
        onDetail: () => act.selectChild(i, "/parent"),
        onReport: () => act.selectChild(i, "/parent/attendance"),
      };
    }),

    monthTabs: monthTabKeys.map((t) => ({
      label: t.y === now.y ? MONTHS[t.m] : `${MONTHS_SHORT[t.m]} ${t.y}`,
      style: seg(selected.key === t.key),
      onGo: () => act.setMonth(t.key === currentKey ? currentKey : t.key),
    })),
    weekDays: ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"],
    calendar: cal,
    calendarMobile: cal.map((c) => ({
      label: c.label,
      style: c.label ? c.style.replace("height:38px", "height:32px").replace("font-size:12.5px", "font-size:11.5px") : "height:32px",
    })),
    attLegend: [
      { label: "İştirak", dotStyle: `width:8px;height:8px;border-radius:3px;background:${accent}` },
      { label: "Gecikmə", dotStyle: "width:8px;height:8px;border-radius:3px;background:rgba(23,23,23,0.3)" },
      { label: "Qayıb", dotStyle: "width:8px;height:8px;border-radius:3px;background:rgba(23,23,23,0.12)" },
      { label: "Dərs yoxdur", dotStyle: "width:8px;height:8px;border-radius:3px;background:#F0EFEB" },
    ],
    attTiles: [
      { v: String(selCounts.present), k: "İştirak" },
      { v: String(selCounts.late), k: "Gecikmə" },
      { v: String(selCounts.absent), k: "Qayıb" },
    ],
    attMonthSummary: selectedSentence ? `${MONTHS[selected.m]} ayında ${selectedSentence} iştirak edilib.` : `${MONTHS[selected.m]} ayında dərs qeydə alınmayıb.`,
    attMonthSummaryShort: selectedRecords.length
      ? `${monthLocative(selected.m)} ${selectedRecords.length} dərsdən ${possessive(selCounts.present + selCounts.late)}.`
      : `${monthLocative(selected.m)} dərs yoxdur.`,
    attNote: attNoteParts.join(" "),

    hwTabs: (["Hamısı", "Aktiv", "Tamamlandı"] as HwFilter[]).map((label) => ({
      label,
      style: seg(hwFilter === label),
      onGo: () => act.setHwFilter(label),
    })),
    hwList: hwVisible.map((x, i) => ({
      title: x.s.title,
      subject: x.s.courseName,
      due: hwDue(x.s, false),
      status: HW_STATUS_LABEL[x.s.status],
      rowStyle: listRow(i, true),
      icon: x.tone === "done" ? "fa-solid fa-check" : "fa-solid fa-file-lines",
      iconStyle: [
        "width:38px;height:38px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0",
        x.tone === "due" ? `background:${accent}14;color:#E66000` : "background:#F2F2EF;color:#4A4A46",
      ].join(";"),
      chipStyle: chip(x.tone),
    })),
    hwEmpty: hwVisible.length === 0,

    unreadLabel: `${unread} oxunmamış`,
    onMarkAllRead: act.markAllRead,
    notifications: data.notifications.map((n) => ({
      title: n.title,
      body: n.body,
      when: ago(n.createdAt),
      icon: notificationIcon(n),
      rowStyle: [
        "display:flex;align-items:flex-start;gap:16px;padding:22px 26px;border-radius:22px",
        !n.read ? `background:#fff;border:1px solid ${accent}26;box-shadow:0 1px 2px rgba(23,23,23,0.03)` : "background:rgba(255,255,255,0.5);border:1px solid rgba(23,23,23,0.045)",
        "transition:transform 0.18s ease,box-shadow 0.18s ease",
        !n.read ? "cursor:pointer" : "",
      ]
        .filter(Boolean)
        .join(";"),
      iconStyle: [
        "width:38px;height:38px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0",
        !n.read ? `background:${accent}14;color:#E66000` : "background:#F2F2EF;color:#4A4A46",
      ].join(";"),
      titleStyle: `font-size:14.5px;font-weight:${!n.read ? 600 : 500};letter-spacing:-0.008em`,
      dotStyle: !n.read ? `width:6px;height:6px;border-radius:50%;background:${accent};flex-shrink:0` : "display:none",
      onOpen: () => {
        if (!n.read) act.openNotification(n.id);
      },
    })),
    noNotifications: data.notifications.length === 0,

    fields: [
      { label: "Ad Soyad", value: data.parent.name, name: "name", readOnly: false },
      { label: "E-poçt", value: data.parent.email, name: "email", readOnly: true },
      { label: "Telefon", value: data.parent.phone ?? "", name: "phone", readOnly: false },
    ],
    toggles: (
      [
        { key: "lessons", label: "Dərs xatırlatmaları", desc: "Dərsdən 1 saat əvvəl bildiriş" },
        { key: "grades", label: "Qiymət və qeydlər", desc: "Müəllim qeydləri və nəticələr" },
      ] as { key: keyof NotificationPrefs; label: string; desc: string }[]
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
    langTabs: (["AZ", "EN"] as Lang[]).map((label) => ({
      label,
      style: [
        "padding:9px 15px;border-radius:10px;border:none;cursor:pointer;font-size:12.5px;font-weight:600",
        "transition:background 0.2s ease,color 0.2s ease,box-shadow 0.2s ease",
        lang === label ? "background:#fff;color:#171717;box-shadow:0 2px 8px -4px rgba(23,23,23,0.3)" : "background:transparent;color:#6F6F6B",
      ].join(";"),
      onGo: () => act.setLang(label),
    })),
    onSaveProfile: act.saveProfile,
    onCancelProfile: act.cancelProfile,
    onChangeAvatar: act.changeAvatar,

    mAtHome: mnav === "home",
    mAtProgress: mnav === "progress",
    mAtAtt: mnav === "att",
    mAtHw: mnav === "hw",
    mAtMe: mnav === "me",
    mTitle: mTitles[mnav][0],
    mSub: mTitles[mnav][1],
    progressPct,
    mobileAttBar: bar(attendancePct),
    mobileProgBar: bar(progressPct),
    mobileNav: (
      [
        ["home", "Ana", "fa-solid fa-house"],
        ["progress", "İnkişaf", "fa-solid fa-chart-simple"],
        ["att", "Davamiyyət", "fa-solid fa-calendar-check"],
        ["hw", "Tapşırıq", "fa-solid fa-book-open"],
        ["me", "Profil", "fa-solid fa-user"],
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
        labelStyle: ["font-size:9.5px;letter-spacing:0.01em", "transition:color 0.2s ease,font-weight 0.2s ease", active ? "font-weight:700;color:#171717" : "font-weight:600"].join(";"),
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
