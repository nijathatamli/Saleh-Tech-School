import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listLessons } from "@/lib/schedule";
import { getSettings } from "@/lib/settings";
import { resolveRange } from "@/lib/admin/reports";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { CreateLessonDialog, LessonRowActions } from "@/components/admin/schedule-dialogs";
import { Pagination, card, th, EmptyState } from "@/components/admin/bits";
import { ScheduleCalendar, LESSON_STATUS as STATUS } from "@/components/admin/schedule-calendar";
import { fromBakuLocal, isRealDay } from "@/features/parent-dashboard/az";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";
const SIZE = 40;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("az-AZ", { timeZone: "Asia/Baku", ...o }).format(new Date(iso));

export default async function AdminSchedulePage({ searchParams }: { searchParams: { from?: string; to?: string; classId?: string; teacherId?: string; status?: string; page?: string; month?: string; day?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  // default window: today → +14 days
  const today = resolveRange().toDay;

  // calendar: ?month=YYYY-MM, ?day=YYYY-MM-DD (defaults to today when viewing the current month)
  const pickedDay = searchParams.day && DAY_RE.test(searchParams.day) && isRealDay(searchParams.day) ? searchParams.day : null;
  const month = searchParams.month && MONTH_RE.test(searchParams.month) ? searchParams.month : (pickedDay ?? today).slice(0, 7);
  const selectedDay = pickedDay && pickedDay.startsWith(month) ? pickedDay : month === today.slice(0, 7) ? today : null;
  const [cy, cm] = month.split("-").map(Number);
  const nextMonth = `${cm === 12 ? cy + 1 : cy}-${String(cm === 12 ? 1 : cm + 1).padStart(2, "0")}`;
  const filters = { classId: searchParams.classId || undefined, teacherId: searchParams.teacherId || undefined, status: searchParams.status || undefined };
  const monthLessons = await listLessons({ from: fromBakuLocal(`${month}-01T00:00`), to: fromBakuLocal(`${nextMonth}-01T00:00`), ...filters, page: 1, size: 500 });
  const calendarItems = searchParams.status === "IN_PROGRESS" ? monthLessons.items.filter((l) => l.status === "IN_PROGRESS") : monthLessons.items;
  const from = searchParams.from || today;
  const to = searchParams.to || new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Baku" }).format(new Date(Date.now() + 14 * 86_400_000));
  const r = resolveRange(from, to);
  const [data, classes, teachers, settings] = await Promise.all([
    listLessons({ from: r.start, to: r.end, classId: searchParams.classId || undefined, teacherId: searchParams.teacherId || undefined, status: searchParams.status || undefined, page, size: SIZE }),
    prisma.classGroup.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.teacherProfile.findMany({ where: { user: { active: true } }, orderBy: { user: { name: "asc" } }, select: { id: true, user: { select: { name: true } } } }),
    getSettings(),
  ]);
  const wantStatus = searchParams.status;
  const items = wantStatus === "IN_PROGRESS" ? data.items.filter((l) => l.status === "IN_PROGRESS") : data.items;

  return (
    <div>
      <AdminTopbar title="Cədvəl" subtitle="Dərslər, müəllimlər və otaqlar" />
      <div className="space-y-6 ap-content">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
            <input type="date" name="from" defaultValue={from} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Başlanğıc" />
            <input type="date" name="to" defaultValue={to} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Son" />
            <select name="classId" defaultValue={searchParams.classId ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Sinif"><option value="">Bütün siniflər</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select name="teacherId" defaultValue={searchParams.teacherId ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Müəllim"><option value="">Bütün müəllimlər</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}</select>
            <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Status"><option value="">Hamısı</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            <Button type="submit" variant="app-outline" size="sm">Göstər</Button>
          </form>
          <CreateLessonDialog classes={classes} defaultMinutes={settings["lesson.defaultMinutes"]} />
        </div>
        <ScheduleCalendar month={month} selected={selectedDay} today={today} lessons={calendarItems}
          query={{ from: searchParams.from, to: searchParams.to, classId: searchParams.classId, teacherId: searchParams.teacherId, status: searchParams.status }} />
        <div className={card}>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Tarix</th><th className={th}>Vaxt</th><th className={th}>Sinif</th><th className={th}>Müəllim</th><th className={th}>Otaq</th><th className={th}>Status</th><th className={th}></th></tr></thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={7} className="px-4 py-4"><EmptyState text="Bu aralıqda dərs yoxdur." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></td></tr>}
                {items.map((l) => (
                  <tr key={l.id} className={`border-b border-navy-50 last:border-0 ${l.status === "CANCELLED" ? "opacity-60" : ""}`}>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">{fmt(l.date, { day: "2-digit", month: "short", weekday: "short" })}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{fmt(l.date, { hour: "2-digit", minute: "2-digit" })}–{fmt(l.endsAt, { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3"><Link href={`/admin/classes/${l.classId}`} className="font-bold hover:text-electric-600">{l.className}</Link><p className="text-xs text-navy-400">{l.courseName}</p></td>
                    <td className="px-4 py-3 text-navy-600"><Link href={`/admin/teachers/${l.teacherId}`} className="hover:text-electric-600">{l.teacherName}</Link></td>
                    <td className="px-4 py-3 text-navy-600">{l.room ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant={STATUS[l.status]?.variant ?? "default"}>{STATUS[l.status]?.label ?? l.status}</Badge></td>
                    <td className="px-4 py-3 text-right"><LessonRowActions id={l.id} status={l.status} date={l.date} minutes={l.minutes} room={l.room} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/schedule" params={{ from, to, classId: searchParams.classId, teacherId: searchParams.teacherId, status: searchParams.status }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
