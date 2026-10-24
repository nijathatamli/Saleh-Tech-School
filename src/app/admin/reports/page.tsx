import { getReports } from "@/lib/admin/reports";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { card, th, EmptyState } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { formatAzn } from "@/lib/utils";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";
const STAGE: Record<string, string> = { NEW: "Yeni", CONTACTED: "Əlaqə saxlanılıb", TRIAL_LESSON: "Sınaq dərsi", TRIAL_COMPLETED: "Sınaq bitib", INTERESTED: "Maraqlıdır", REGISTERED: "Tələbə yaradılıb", REJECTED: "Rədd edilib" };

const Stat = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <div className={`${card} p-5`}><p className="text-xs font-bold uppercase tracking-widest text-navy-400">{label}</p><p className="mt-2 text-2xl font-extrabold text-navy-900">{value}</p>{hint && <p className="mt-1 text-xs text-navy-400">{hint}</p>}</div>
);

export default async function AdminReportsPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  await adminGuard();
  const r = await getReports(searchParams.from, searchParams.to);
  const maxRev = Math.max(1, ...r.financial.revenueByMonth.map((m) => m.amount));
  return (
    <div>
      <AdminTopbar title="Hesabatlar" subtitle={`${r.range.from} — ${r.range.to}`} />
      <div className="space-y-10 p-6 md:p-10">
        <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
          <input type="date" name="from" defaultValue={r.range.from} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Başlanğıc" />
          <input type="date" name="to" defaultValue={r.range.to} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Son" />
          <Button type="submit" variant="app-outline" size="sm">Göstər</Button>
        </form>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-navy-900">Tələbələr</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Stat label="Ümumi" value={r.students.total} /><Stat label="Aktiv" value={r.students.active} hint={`${r.students.inactive} deaktiv`} />
            <Stat label="Dövrdə yeni" value={r.students.newInRange} /><Stat label="Sinifsiz aktiv" value={r.students.withoutClass} />
            <Stat label="Davamiyyət" value={`${r.students.attendance.rate}%`} hint={`${r.students.attendance.total} qeyd · ${(r.students.attendance as Record<string, number>).ABSENT ?? 0} qayıb`} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-navy-900">Siniflər</h2>
          <div className={card}><div className="table-scroll overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-navy-100"><th className={th}>Sinif</th><th className={th}>Müəllim</th><th className={th}>Tələbə</th><th className={th}>Doluluq</th><th className={th}>Dərslər</th><th className={th}>Tamamlanıb</th><th className={th}>Davamiyyət</th></tr></thead>
            <tbody>
              {r.classes.length === 0 && <tr><td colSpan={7} className="px-4 py-4"><EmptyState text="Aktiv sinif yoxdur." /></td></tr>}
              {r.classes.map((c) => <tr key={c.id} className="border-b border-navy-50 last:border-0"><td className="px-4 py-3 font-bold"><a href={`/admin/classes/${c.id}`} className="hover:text-electric-600">{c.name}</a></td><td className="px-4 py-3 text-navy-600">{c.teacher}</td><td className="px-4 py-3">{c.students}{c.capacity ? ` / ${c.capacity}` : ""}</td><td className="px-4 py-3">{c.utilization !== null ? `${c.utilization}%` : "—"}</td><td className="px-4 py-3">{c.lessons}</td><td className="px-4 py-3">{c.completedLessons}</td><td className="px-4 py-3">{c.attendanceRate !== null ? `${c.attendanceRate}%` : "—"}</td></tr>)}
            </tbody></table></div></div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-navy-900">Maliyyə</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Gözləyən" value={r.financial.due.count} hint={formatAzn(r.financial.due.amount)} />
            <Stat label={`Gecikmiş (${r.financial.overdue.afterDays}+ gün)`} value={r.financial.overdue.count} hint={formatAzn(r.financial.overdue.amount)} />
            <Stat label="Dövrdə ödənilib" value={r.financial.paidInRange.count} hint={formatAzn(r.financial.paidInRange.amount)} />
            <Stat label="Cəmi ödənilib" value={r.financial.paid.count} hint={formatAzn(r.financial.paid.amount)} />
          </div>
          <div className={`${card} p-6`}>
            <p className="mb-4 text-sm font-bold text-navy-900">Son 6 ay gəlir</p>
            {r.financial.revenueByMonth.length === 0 && <p className="text-sm text-navy-400">Ödəniş qeydi yoxdur.</p>}
            <ul className="space-y-2">{r.financial.revenueByMonth.map((m) => <li key={m.month} className="flex items-center gap-3 text-sm"><span className="w-20 text-navy-400">{m.month}</span><span className="h-3 rounded-full bg-electric-500" style={{ width: `${Math.max(2, (m.amount / maxRev) * 70)}%` }} /><b>{formatAzn(m.amount)}</b></li>)}</ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-navy-900">Müəllim yükü</h2>
          <div className={card}><div className="table-scroll overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-navy-100"><th className={th}>Müəllim</th><th className={th}>Siniflər</th><th className={th}>Tələbələr</th><th className={th}>Dərslər</th><th className={th}>Saat</th></tr></thead>
            <tbody>{r.teachers.map((t) => <tr key={t.id} className="border-b border-navy-50 last:border-0"><td className="px-4 py-3 font-bold"><a href={`/admin/teachers/${t.id}`} className="hover:text-electric-600">{t.name}</a></td><td className="px-4 py-3">{t.classes}</td><td className="px-4 py-3">{t.students}</td><td className="px-4 py-3">{t.lessons}</td><td className="px-4 py-3">{t.hours}</td></tr>)}</tbody></table></div></div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-extrabold text-navy-900">Qəbul</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Müraciətlər" value={r.admissions.total} /><Stat label="Tələbəyə çevrilib" value={r.admissions.converted} hint={`${r.admissions.conversionRate}% konversiya`} />
            {Object.entries(r.admissions.byStage).filter(([k]) => k !== "REGISTERED").slice(0, 2).map(([k, v]) => <Stat key={k} label={STAGE[k] ?? k} value={v} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
