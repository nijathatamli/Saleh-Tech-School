import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeacher } from "@/lib/admin/teachers";
import { ApiError } from "@/lib/api";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ActiveToggle, EditTeacherDialog } from "@/components/admin/teacher-dialogs";
import { ClassStatusBadge, card, fmtDate, th, EmptyState } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";

export default async function AdminTeacherDetailPage({ params }: { params: { id: string } }) {
  await adminGuard();
  const t = await getTeacher(params.id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!t) notFound();
  return (
    <div>
      <AdminTopbar title={t.name} subtitle={`${t.position} · ${t.email}`} />
      <div className="space-y-6 p-6 md:p-10">
        <Link href="/admin/teachers" className="text-xs font-bold text-electric-600 hover:underline">← Bütün müəllimlər</Link>
        <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
          <div><div className="flex items-center gap-3"><h2 className="font-display text-xl text-navy-900">{t.name}</h2><Badge variant={t.active ? "success" : "default"}>{t.active ? "Aktiv" : "Deaktiv"}</Badge></div><p className="mt-1 text-sm text-navy-600">{t.phone ?? "telefon yoxdur"} · {t.experienceYears} il təcrübə</p><div className="mt-2 flex flex-wrap gap-2">{t.specializations.map((s) => <Badge key={s} variant="app-electric">{s}</Badge>)}</div></div>
          <div className="flex flex-wrap items-center gap-2"><EditTeacherDialog teacher={{ id: t.id, name: t.name, email: t.email, phone: t.phone, position: t.position, bio: t.bio, experienceYears: t.experienceYears, specializations: t.specializations }} /><ActiveToggle endpoint={`/api/admin/teachers/${t.id}`} active={t.active} label={t.name} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 [overflow-wrap:anywhere] sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Aktiv siniflər", t.workload.classes], ["Tələbələr", t.workload.students], ["Növbəti 7 gün", `${t.workload.lessonsWeek} dərs · ${t.workload.hoursWeek} saat`], ["Bu ay dərs", t.workload.lessonsMonth]].map(([l, v]) => (
            <div key={String(l)} className={`${card} p-5`}><p className="text-xs font-bold uppercase tracking-widest text-navy-400">{l}</p><p className="mt-2 text-2xl font-extrabold text-navy-900">{v}</p></div>
          ))}
        </div>
        <section className={card}>
          <h2 className="px-6 pt-5 text-base font-extrabold text-navy-900">Siniflər</h2>
          <div className="table-scroll overflow-x-auto"><table className="mt-2 w-full text-sm"><thead><tr className="border-b border-navy-100"><th className={th}>Sinif</th><th className={th}>Kurs</th><th className={th}>Tələbə</th><th className={th}>Dərs</th><th className={th}>Status</th></tr></thead>
            <tbody>
              {t.classes.length === 0 && <tr><td colSpan={5} className="px-4 py-4"><EmptyState text="Sinif təyin edilməyib." /></td></tr>}
              {t.classes.map((c) => <tr key={c.id} className="border-b border-navy-50 last:border-0"><td className="px-4 py-3"><Link href={`/admin/classes/${c.id}`} className="font-bold hover:text-electric-600">{c.name}</Link></td><td className="px-4 py-3 text-navy-600">{c.courseName}</td><td className="px-4 py-3">{c.students}</td><td className="px-4 py-3">{c.lessons}</td><td className="px-4 py-3"><ClassStatusBadge status={c.status} /></td></tr>)}
            </tbody></table></div>
        </section>
        <section className={card}>
          <h2 className="px-6 pt-5 text-base font-extrabold text-navy-900">Yaxın 14 günün cədvəli</h2>
          <ul className="mt-2 divide-y divide-navy-50 text-sm">
            {t.schedule.length === 0 && <li className="px-6 py-4"><EmptyState text="Planlaşdırılmış dərs yoxdur." /></li>}
            {t.schedule.map((l) => <li key={l.id} className="flex items-center justify-between px-6 py-3"><Link href={`/admin/classes/${l.classId}`} className="font-bold hover:text-electric-600">{l.className}</Link><span className="text-navy-600">{fmtDate(l.date)} · {l.minutes} dəq{l.room ? ` · ${l.room}` : ""}</span></li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
