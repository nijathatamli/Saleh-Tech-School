import { listAdminCourses, getCourse } from "@/lib/admin/courses";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { CreateCourseDialog, EditCourseDialog } from "@/components/admin/course-dialogs";
import { CATEGORY_LABEL, LEVEL_LABEL } from "@/lib/admin/labels";
import { ActiveToggle } from "@/components/admin/teacher-dialogs";
import { Pagination, card, th } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAzn } from "@/lib/utils";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminCoursesPage({ searchParams }: { searchParams: { q?: string; active?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const active = searchParams.active === "true" ? true : searchParams.active === "false" ? false : undefined;
  const data = await listAdminCourses({ q: searchParams.q?.trim() || undefined, active, page, size: SIZE });
  const full = await Promise.all(data.items.map((c) => getCourse(c.id)));
  return (
    <div>
      <AdminTopbar title="Kurslar" subtitle="Kataloq, qiymət, modullar və aktivlik" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
            <input name="q" defaultValue={searchParams.q} placeholder="Kurs adı və ya kateqoriya..." className="w-64 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
            <select name="active" defaultValue={searchParams.active ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Status"><option value="">Hamısı</option><option value="true">Aktiv</option><option value="false">Deaktiv</option></select>
            <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
          </form>
          <CreateCourseDialog />
        </div>
        <div className={card}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Kurs</th><th className={th}>Yaş</th><th className={th}>Səviyyə</th><th className={th}>Qiymət</th><th className={th}>Modul</th><th className={th}>Aktiv siniflər</th><th className={th}>Status</th><th className={th}></th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-navy-400">Kurs tapılmadı.</td></tr>}
                {data.items.map((c, i) => (
                  <tr key={c.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3"><p className="font-bold text-navy-900">{c.name}</p><p className="text-xs text-navy-400">{CATEGORY_LABEL[c.category] ?? c.category}{c.featured ? " · Populyar" : ""}</p></td>
                    <td className="px-4 py-3 text-navy-600">{c.minAge}-{c.maxAge}</td><td className="px-4 py-3 text-navy-600">{LEVEL_LABEL[c.level]}</td>
                    <td className="px-4 py-3 text-navy-600">{formatAzn(c.price)}</td><td className="px-4 py-3 text-navy-600">{c.modules}</td><td className="px-4 py-3 font-bold">{c.activeClasses}</td>
                    <td className="px-4 py-3"><Badge variant={c.active ? "success" : "default"}>{c.active ? "Aktiv" : "Deaktiv"}</Badge></td>
                    <td className="px-4 py-3"><div className="flex items-center justify-end gap-3"><EditCourseDialog course={full[i]} /><ActiveToggle endpoint={`/api/admin/courses/${c.id}`} active={c.active} label="Kurs" confirmText="Kurs deaktiv edilsin? Saytdan və yeni sinif seçimindən gizlənəcək; mövcud siniflər və ödənişlər saxlanılacaq." /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/courses" params={{ q: searchParams.q, active: searchParams.active }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
