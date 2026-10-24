import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listAttendance } from "@/lib/admin/attendance";
import { resolveRange } from "@/lib/admin/reports";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Pagination, card, fmtDate, th, EmptyState } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";
const SIZE = 40;
const L: Record<string, { label: string; v: "success" | "danger" | "warning" | "default" }> = { PRESENT: { label: "İştirak", v: "success" }, ABSENT: { label: "Qayıb", v: "danger" }, LATE: { label: "Gecikib", v: "warning" }, EXCUSED: { label: "Üzrlü", v: "default" } };

export default async function AdminAttendancePage({ searchParams }: { searchParams: { classId?: string; status?: string; from?: string; to?: string; studentId?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const range = resolveRange(searchParams.from, searchParams.to);
  const [data, classes] = await Promise.all([
    listAttendance({ classId: searchParams.classId, studentId: searchParams.studentId, status: searchParams.status, from: range.fromDay, to: range.toDay, page, size: SIZE }),
    prisma.classGroup.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const t = data.totals;
  const rate = data.total ? Math.round((((t.PRESENT ?? 0) + (t.LATE ?? 0)) / data.total) * 100) : 0;
  return (
    <div>
      <AdminTopbar title="Davamiyyət" subtitle="Bütün siniflər üzrə qeydlər (müəllim qeyd edir, admin yoxlayır)" />
      <div className="space-y-6 p-6 md:p-10">
        <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
          <input type="date" name="from" defaultValue={range.fromDay} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Başlanğıc" />
          <input type="date" name="to" defaultValue={range.toDay} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Son" />
          <select name="classId" defaultValue={searchParams.classId ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Sinif"><option value="">Bütün siniflər</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Status"><option value="">Bütün statuslar</option>{Object.entries(L).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          <Button type="submit" variant="app-outline" size="sm">Göstər</Button>
        </form>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-5">
          {[["Qeyd", data.total], ["İştirak", t.PRESENT ?? 0], ["Gecikib", t.LATE ?? 0], ["Qayıb", t.ABSENT ?? 0], ["Davamiyyət", `${rate}%`]].map(([l, v]) => <div key={String(l)} className={`${card} p-4`}><p className="text-xs font-bold uppercase tracking-widest text-navy-400">{l}</p><p className="mt-1 text-2xl font-extrabold text-navy-900">{v}</p></div>)}
        </div>
        <div className={card}>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Tarix</th><th className={th}>Tələbə</th><th className={th}>Sinif</th><th className={th}>Status</th><th className={th}>Qeyd edən</th><th className={th}>Qeyd</th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-4"><EmptyState text="Qeyd tapılmadı." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></td></tr>}
                {data.items.map((a) => (
                  <tr key={a.id} className="border-b border-navy-50 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy-400">{fmtDate(a.date)}</td>
                    <td className="px-4 py-3"><Link href={`/admin/students/${a.studentId}`} className="font-bold hover:text-electric-600">{a.studentName}</Link></td>
                    <td className="px-4 py-3"><Link href={`/admin/classes/${a.classId}`} className="hover:text-electric-600">{a.className}</Link></td>
                    <td className="px-4 py-3"><Badge variant={L[a.status].v}>{L[a.status].label}</Badge></td>
                    <td className="px-4 py-3 text-navy-600">{a.markedBy ?? "—"}</td>
                    <td className="px-4 py-3 text-navy-600">{a.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/attendance" params={{ from: range.fromDay, to: range.toDay, classId: searchParams.classId, status: searchParams.status }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
