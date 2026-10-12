import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LessonRowActions } from "@/components/admin/schedule-dialogs";
import { card } from "@/components/admin/bits";

export const LESSON_STATUS: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "primary" }> = {
  SCHEDULED: { label: "Planlaşdırılıb", variant: "primary" }, IN_PROGRESS: { label: "Davam edir", variant: "warning" }, COMPLETED: { label: "Tamamlanıb", variant: "success" }, CANCELLED: { label: "Ləğv edilib", variant: "danger" },
};

export type CalendarLesson = {
  id: string; date: string; endsAt: string; minutes: number; room: string | null; status: string;
  classId: string; className: string; courseName: string; teacherId: string; teacherName: string;
};

const WEEKDAYS = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"];
const bakuDay = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Baku" }).format(new Date(iso));
const clock = (iso: string) => new Intl.DateTimeFormat("az-AZ", { timeZone: "Asia/Baku", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const two = (n: number) => String(n).padStart(2, "0");

/** Monthly calendar (Monday-first) + the lessons of the selected day. Navigation is plain links, so it stays a server component. */
export function ScheduleCalendar({ month, selected, today, lessons, query }: {
  month: string; selected: string | null; today: string; lessons: CalendarLesson[]; query: Record<string, string | undefined>;
}) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const blanks = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("az-AZ", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(Date.UTC(y, m - 1, 1)));

  const byDay = new Map<string, CalendarLesson[]>();
  for (const l of lessons) {
    const k = bakuDay(l.date);
    byDay.set(k, [...(byDay.get(k) ?? []), l]);
  }

  const href = (over: { month?: string; day?: string | null }) => {
    const qs = new URLSearchParams(Object.entries(query).filter((e): e is [string, string] => !!e[1]));
    qs.set("month", over.month ?? month);
    if (over.day) qs.set("day", over.day);
    return `/admin/schedule?${qs}`;
  };
  const shift = (delta: number) => { const d = new Date(Date.UTC(y, m - 1 + delta, 1)); return `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}`; };

  const dayLessons = selected ? byDay.get(selected) ?? [] : [];
  const selectedLabel = selected ? new Intl.DateTimeFormat("az-AZ", { timeZone: "UTC", day: "numeric", month: "long", weekday: "long" }).format(new Date(`${selected}T00:00:00Z`)) : "";
  const navBtn = "flex h-9 w-9 items-center justify-center rounded-xl border border-navy-100 text-navy-600 hover:bg-navy-50";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className={`${card} p-5`}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link href={href({ month: shift(-1) })} className={navBtn} aria-label="Əvvəlki ay" scroll={false}>‹</Link>
          <div className="text-center">
            <h2 className="text-base font-bold capitalize">{monthLabel}</h2>
            {month !== today.slice(0, 7) && <Link href={href({ month: today.slice(0, 7), day: today })} className="text-xs font-bold text-electric-600 hover:underline" scroll={false}>Bu günə qayıt</Link>}
          </div>
          <Link href={href({ month: shift(1) })} className={navBtn} aria-label="Növbəti ay" scroll={false}>›</Link>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-navy-400">
          {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: blanks }, (_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const iso = `${month}-${two(d)}`;
            const all = byDay.get(iso) ?? [];
            const active = all.filter((l) => l.status !== "CANCELLED").length;
            const isSel = iso === selected;
            const tone = isSel
              ? "bg-electric-500 text-white shadow-md shadow-electric-500/25"
              : active > 0 ? "bg-electric-500/10 text-navy-900 hover:bg-electric-500/20" : "bg-navy-50/60 text-navy-400 hover:bg-navy-50";
            return (
              <Link key={iso} href={href({ day: iso })} scroll={false} aria-label={`${d} — ${active} dərs`} aria-current={isSel ? "date" : undefined}
                className={`relative flex h-12 flex-col items-center justify-center rounded-xl text-sm font-semibold tabular-nums transition ${tone} ${iso === today && !isSel ? "ring-2 ring-electric-400" : ""}`}>
                <span>{d}</span>
                {active > 0
                  ? <span className={`mt-0.5 text-[10px] font-bold leading-none ${isSel ? "text-white/90" : "text-electric-600"}`}>{active} dərs</span>
                  : all.length > 0 ? <span className="mt-0.5 text-[10px] leading-none text-red-400">ləğv</span> : null}
              </Link>
            );
          })}
        </div>
      </div>

      <div className={`${card} p-5`}>
        {!selected ? (
          <p className="py-16 text-center text-sm text-navy-400">Dərsləri görmək üçün təqvimdən gün seçin.</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-bold capitalize">{selectedLabel}</h2>
              <span className="text-sm font-semibold text-navy-400">{dayLessons.length} dərs</span>
            </div>
            {dayLessons.length === 0 ? (
              <p className="py-12 text-center text-sm text-navy-400">Bu gün üçün dərs əlavə edilməyib.</p>
            ) : (
              <ul className="space-y-3">
                {dayLessons.map((l) => (
                  <li key={l.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-navy-100 px-4 py-3 ${l.status === "CANCELLED" ? "opacity-60" : ""}`}>
                    <span className="w-28 shrink-0 rounded-xl bg-navy-50 px-3 py-2 text-center text-sm font-bold tabular-nums">{clock(l.date)}–{clock(l.endsAt)}</span>
                    <div className="min-w-[160px] flex-1">
                      <Link href={`/admin/classes/${l.classId}`} className="font-bold hover:text-electric-600">{l.className}</Link>
                      <p className="text-xs text-navy-400">{l.courseName}</p>
                      <p className="mt-1 text-sm text-navy-600">
                        <Link href={`/admin/teachers/${l.teacherId}`} className="hover:text-electric-600">{l.teacherName}</Link>
                        {l.room ? ` · ${l.room}` : ""}
                      </p>
                    </div>
                    <Badge variant={LESSON_STATUS[l.status]?.variant ?? "default"}>{LESSON_STATUS[l.status]?.label ?? l.status}</Badge>
                    <LessonRowActions id={l.id} status={l.status} date={l.date} minutes={l.minutes} room={l.room} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
