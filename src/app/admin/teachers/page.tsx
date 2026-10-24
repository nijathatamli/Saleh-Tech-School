import Link from "next/link";
import { listTeachers } from "@/lib/admin/teachers";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { CreateTeacherDialog } from "@/components/admin/teacher-dialogs";
import { Pagination, card, th, EmptyState } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
import { cleanQ } from "@/lib/search";
export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminTeachersPage({ searchParams }: { searchParams: { q?: string; active?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const active = searchParams.active === "true" ? true : searchParams.active === "false" ? false : undefined;
  const data = await listTeachers({ q: cleanQ(searchParams.q), active, page, size: SIZE });
  return (
    <div>
      <AdminTopbar title="Müəllimlər" subtitle="Hesablar, siniflər və yük" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
            <input name="q" defaultValue={searchParams.q} placeholder="Ad, e-poçt və ya vəzifə..." className="w-64 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
            <select name="active" defaultValue={searchParams.active ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Status"><option value="">Hamısı</option><option value="true">Aktiv</option><option value="false">Deaktiv</option></select>
            <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
          </form>
          <CreateTeacherDialog />
        </div>
        <div className={card}>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Müəllim</th><th className={th}>Siniflər</th><th className={th}>Tələbələr</th><th className={th}>Növbəti 7 gün</th><th className={th}>Bu ay dərs</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-4"><EmptyState text="Müəllim tapılmadı." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></td></tr>}
                {data.items.map((t) => (
                  <tr key={t.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/50">
                    <td className="px-4 py-3"><Link href={`/admin/teachers/${t.id}`} className="font-bold text-navy-900 hover:text-electric-600">{t.name}</Link><p className="text-xs text-navy-400">{t.position} · {t.email}</p></td>
                    <td className="px-4 py-3 font-bold">{t.classes}</td><td className="px-4 py-3">{t.students}</td>
                    <td className="px-4 py-3 text-navy-600">{t.lessonsWeek} dərs · {t.hoursWeek} saat</td><td className="px-4 py-3 text-navy-600">{t.lessonsMonth}</td>
                    <td className="px-4 py-3"><Badge variant={t.active ? "success" : "default"}>{t.active ? "Aktiv" : "Deaktiv"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/teachers" params={{ q: searchParams.q, active: searchParams.active }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
