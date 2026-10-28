import Link from "next/link";
import { listClasses, listCourses, searchTeachers } from "@/lib/admin/classes";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { CreateClassDialog } from "@/components/admin/class-dialogs";
import { ClassStatusBadge, Pagination, card, th, EmptyState } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
import { cleanQ } from "@/lib/search";
export const dynamic = "force-dynamic";
const SIZE = 15;

export default async function AdminClassesPage({ searchParams }: { searchParams: { q?: string; status?: string; teacher?: string; sort?: string; dir?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = searchParams.status === "ARCHIVED" || searchParams.status === "ALL" ? searchParams.status : "ACTIVE";
  const sort = searchParams.sort === "created" || searchParams.sort === "students" ? searchParams.sort : "name";
  const dir = searchParams.dir === "desc" ? "desc" : "asc";
  const [data, courses, teachers] = await Promise.all([
    listClasses({ q: cleanQ(searchParams.q), status, teacherId: searchParams.teacher || undefined, sort, dir, page, size: SIZE }),
    listCourses(),
    searchTeachers("", 50),
  ]);
  const params = { q: searchParams.q, status: searchParams.status, teacher: searchParams.teacher, sort: searchParams.sort, dir: searchParams.dir };

  return (
    <div>
      <AdminTopbar title="Siniflər" subtitle="Sinif, müəllim və tələbə təyinatları" />
      <div className="space-y-6 ap-content">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
            <input name="q" defaultValue={searchParams.q} placeholder="Sinif, kurs və ya müəllim axtar..." className="w-64 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
            <select name="status" defaultValue={status} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Status">
              <option value="ACTIVE">Aktiv</option><option value="ARCHIVED">Arxiv</option><option value="ALL">Hamısı</option>
            </select>
            <select name="teacher" defaultValue={searchParams.teacher ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Müəllim">
              <option value="">Bütün müəllimlər</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select name="sort" defaultValue={sort} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Sıralama">
              <option value="name">Ada görə</option><option value="created">Yaradılma tarixi</option><option value="students">Tələbə sayı</option>
            </select>
            <select name="dir" defaultValue={dir} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="İstiqamət">
              <option value="asc">Artan</option><option value="desc">Azalan</option>
            </select>
            <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
          </form>
          <CreateClassDialog courses={courses} />
        </div>

        <div className={card}>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100">
                <th className={th}>Sinif</th><th className={th}>Müəllim</th><th className={th}>Tələbə</th><th className={th}>Tamamlanan dərs</th><th className={th}>Ödəniş</th><th className={th}>Status</th>
              </tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-4"><EmptyState text="Sinif tapılmadı." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></td></tr>}
                {data.items.map((c) => (
                  <tr key={c.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/50">
                    <td className="px-4 py-3"><Link href={`/admin/classes/${c.id}`} className="font-bold text-navy-900 hover:text-electric-600">{c.name}</Link><p className="text-xs text-navy-400">{c.courseName}</p></td>
                    <td className="px-4 py-3 text-navy-600">{c.teacherName}</td>
                    <td className="px-4 py-3 font-bold">{c.students}</td>
                    <td className="px-4 py-3 text-navy-600">{c.completedLessons}</td>
                    <td className="px-4 py-3">{c.paymentsDue > 0 ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">{c.paymentsDue} ödəniş vaxtı</span> : <span className="text-navy-400">—</span>}</td>
                    <td className="px-4 py-3"><ClassStatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/classes" params={params} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
