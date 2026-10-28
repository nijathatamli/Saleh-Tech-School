import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassDetail } from "@/lib/admin/classes";
import { listLessons } from "@/lib/schedule";
import { ApiError } from "@/lib/api";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AddStudentsDialog, ArchiveClassButton, ChangeTeacherDialog, EditClassDialog, RemoveStudentButton } from "@/components/admin/class-dialogs";
import { ClassStatusBadge, PaymentBadge, card, fmtDate, th, EmptyState } from "@/components/admin/bits";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";

export default async function AdminClassDetailPage({ params }: { params: { id: string } }) {
  await adminGuard();
  const c = await getClassDetail(params.id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!c) notFound();
  const lessons = await listLessons({ from: new Date(Date.now() - 7 * 86_400_000), classId: c.id, page: 1, size: 12 });
  const LS: Record<string, string> = { SCHEDULED: "Planlaşdırılıb", IN_PROGRESS: "Davam edir", COMPLETED: "Tamamlanıb", CANCELLED: "Ləğv edilib" };

  return (
    <div>
      <AdminTopbar title={c.name} subtitle={`${c.course.name} · ${c.teacher.name}`} />
      <div className="space-y-6 ad-content">
        <Link href="/admin/classes" className="text-xs font-bold text-electric-600 hover:underline">← Bütün siniflər</Link>

        <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
          <div className="space-y-1">
            <div className="flex items-center gap-3"><h2 className="font-display text-xl text-navy-900">{c.name}</h2><ClassStatusBadge status={c.status} /></div>
            <p className="text-sm text-navy-600">Müəllim: <b>{c.teacher.name}</b> <span className="text-navy-400">({c.teacher.position})</span></p>
            <p className="text-xs text-navy-400">Kurs: {c.course.name} · Cədvəl: {c.schedule} · Yaradılıb: {fmtDate(c.createdAt)} · Ödəniş dövrü: {c.lessonsPerCycle} dərs · Tutum: {c.metrics.students}{c.capacity ? ` / ${c.capacity}` : " (limitsiz)"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EditClassDialog cls={{ id: c.id, name: c.name, schedule: c.schedule, lessonsPerCycle: c.lessonsPerCycle, capacity: c.capacity, status: c.status }} />
            <ChangeTeacherDialog classId={c.id} current={c.teacher.name} />
            {c.status === "ACTIVE" && <AddStudentsDialog classId={c.id} />}
            <ArchiveClassButton classId={c.id} status={c.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Tələbələr", v: c.metrics.students },
            { l: "Planlaşdırılmış dərslər", v: c.metrics.lessons },
            { l: "Tamamlanmış dərslər (cəmi)", v: c.metrics.completedLessons },
            { l: "Ödəniş vaxtı", v: c.metrics.paymentsDue },
          ].map((m) => (
            <div key={m.l} className={`${card} p-5`}><p className="text-xs font-bold uppercase tracking-widest text-navy-400">{m.l}</p><p className="mt-2 break-words text-2xl font-extrabold sm:text-3xl text-navy-900">{m.v}</p></div>
          ))}
        </div>

        <div className={card}>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Tələbə</th><th className={th}>Gedişat</th><th className={th}>Dərslər</th><th className={th}>Ödəniş</th><th className={th}></th></tr></thead>
              <tbody>
                {c.students.length === 0 && <tr><td colSpan={5} className="px-4 py-4"><EmptyState text="Bu sinifdə hələ tələbə yoxdur." /></td></tr>}
                {c.students.map((s) => (
                  <tr key={s.studentId} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3"><Link href={`/admin/students/${s.studentId}`} className="font-bold text-navy-900 hover:text-electric-600">{s.name}</Link><p className="text-xs text-navy-400">{s.grade ? `${s.grade}-ci sinif · ` : ""}{s.email ?? "giriş yoxdur"}</p></td>
                    <td className="px-4 py-3">
                      <span className="font-bold">{s.progress}/{c.lessonsPerCycle}</span>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-navy-100"><div className="h-full rounded-full bg-electric-500" style={{ width: `${(s.progress / c.lessonsPerCycle) * 100}%` }} /></div>
                    </td>
                    <td className="px-4 py-3 text-navy-600">{s.completedLessons}</td>
                    <td className="px-4 py-3">{s.payment && s.payment.status !== "PAID" ? <PaymentBadge status={s.payment.status} /> : s.payment ? <span className="text-xs text-navy-400">{s.payment.cycle}-ci dövr ödənilib</span> : <span className="text-navy-400">—</span>}</td>
                    <td className="px-4 py-3 text-right">{c.status === "ACTIVE" && <RemoveStudentButton classId={c.id} studentId={s.studentId} name={s.name} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <section className={card}>
          <div className="flex items-center justify-between px-6 pt-5"><h2 className="text-base font-extrabold text-navy-900">Dərslər (son həftə və gələcək)</h2><Link href={`/admin/schedule?classId=${c.id}`} className="text-xs font-bold text-electric-600 hover:underline">Cədvəldə aç</Link></div>
          <table className="mt-2 w-full text-sm"><thead><tr className="border-b border-navy-100"><th className={th}>Tarix</th><th className={th}>Otaq</th><th className={th}>Status</th></tr></thead>
            <tbody>
              {lessons.items.length === 0 && <tr><td colSpan={3} className="px-4 py-4"><EmptyState text="Planlaşdırılmış dərs yoxdur." /></td></tr>}
              {lessons.items.map((l) => <tr key={l.id} className="border-b border-navy-50 last:border-0"><td className="px-4 py-3">{fmtDate(l.date)}</td><td className="px-4 py-3 text-navy-600">{l.room ?? "—"}</td><td className="px-4 py-3 text-navy-600">{LS[l.status] ?? l.status}</td></tr>)}
            </tbody></table>
        </section>
      </div>
    </div>
  );
}
