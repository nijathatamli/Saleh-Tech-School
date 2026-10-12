import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { listStudents } from "@/lib/admin/students";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { CreateStudentDialog } from "@/components/admin/student-dialog";
import { Pagination, card, fmtDate, th } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminStudentsPage({ searchParams }: { searchParams: { q?: string; active?: string; classId?: string; grade?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const active = searchParams.active === "true" ? true : searchParams.active === "false" ? false : undefined;
  const grade = Number(searchParams.grade) || undefined;
  const [data, classes] = await Promise.all([
    listStudents({ q: searchParams.q?.trim() || undefined, active, classId: searchParams.classId || undefined, grade, page, size: SIZE }),
    prisma.classGroup.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div>
      <AdminTopbar title="Tələbələr" subtitle="Hesablar, siniflər və axtarış" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
            <input name="q" defaultValue={searchParams.q} placeholder="Ad, soyad, FIN, e-poçt və ya tələbə ID..." className="w-72 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
            <select name="active" defaultValue={searchParams.active ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Status">
              <option value="">Hamısı</option><option value="true">Aktiv</option><option value="false">Deaktiv</option>
            </select>
            <select name="classId" defaultValue={searchParams.classId ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Sinif"><option value="">Bütün siniflər</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <select name="grade" defaultValue={searchParams.grade ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Sinif səviyyəsi"><option value="">Bütün səviyyələr</option>{Array.from({ length: 11 }, (_, i) => i + 1).map((g) => <option key={g} value={g}>{g}-ci sinif</option>)}</select>
            <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
          </form>
          <CreateStudentDialog />
        </div>
        <div className={card}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Tələbə</th><th className={th}>FIN</th><th className={th}>Valideyn</th><th className={th}>Siniflər</th><th className={th}>Status</th><th className={th}>Yaradılıb</th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-navy-400">Tələbə tapılmadı.</td></tr>}
                {data.items.map((s) => (
                  <tr key={s.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/50">
                    <td className="px-4 py-3"><Link href={`/admin/students/${s.id}`} className="font-bold text-navy-900 hover:text-electric-600">{s.name}</Link><p className="text-xs text-navy-400">{s.grade ? `${s.grade}-ci sinif · ` : ""}{s.email ?? "giriş yoxdur"}</p></td>
                    <td className="px-4 py-3 font-mono text-xs">{s.fin ?? "—"}</td>
                    <td className="px-4 py-3 text-navy-600">{s.parentName}</td>
                    <td className="px-4 py-3 text-navy-600">{s.classNames.length ? s.classNames.join(", ") : "—"}</td>
                    <td className="px-4 py-3"><Badge variant={s.active ? "success" : "default"}>{s.active ? "Aktiv" : "Deaktiv"}</Badge></td>
                    <td className="px-4 py-3 text-xs text-navy-400">{fmtDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/students" params={{ q: searchParams.q, active: searchParams.active, classId: searchParams.classId, grade: searchParams.grade }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
