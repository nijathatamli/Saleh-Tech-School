import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudent } from "@/lib/admin/students";
import { ApiError } from "@/lib/api";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { PaymentActions } from "@/components/admin/payment-actions";
import { PaymentBadge, card, fmtDate, th } from "@/components/admin/bits";
import { EditStudentDialog } from "@/components/admin/student-dialog";
import { ChangeParentDialog } from "@/components/admin/parent-dialogs";
import { ActiveToggle } from "@/components/admin/teacher-dialogs";
import { Badge } from "@/components/ui/badge";

import { adminGuard } from "@/lib/admin/guard";
const ATT: Record<string, { label: string; v: "success" | "danger" | "warning" | "default" }> = { PRESENT: { label: "İştirak", v: "success" }, ABSENT: { label: "Qayıb", v: "danger" }, LATE: { label: "Gecikib", v: "warning" }, EXCUSED: { label: "Üzrlü", v: "default" } };

export const dynamic = "force-dynamic";

export default async function AdminStudentDetailPage({ params }: { params: { id: string } }) {
  await adminGuard();
  const s = await getStudent(params.id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!s) notFound();
  return (
    <div>
      <AdminTopbar title={s.name} subtitle={s.email ?? "giriş yoxdur"} />
      <div className="space-y-6 p-6 md:p-10">
        <Link href="/admin/students" className="text-xs font-bold text-electric-600 hover:underline">← Bütün tələbələr</Link>
        <div className={`${card} p-6`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Badge variant={s.active ? "success" : "default"}>{s.active ? "Aktiv" : "Deaktiv"}</Badge>
            <div className="flex items-center gap-3"><EditStudentDialog student={{ id: s.id, firstName: s.firstName, lastName: s.lastName, grade: s.grade, fin: s.fin, birthDate: s.birthDate }} /><ActiveToggle endpoint={`/api/admin/students/${s.id}`} active={s.active} label="Tələbə" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[["Sinif", s.grade ? `${s.grade}-ci` : "—"], ["FIN", s.fin ?? "—"], ["Doğum tarixi", s.birthDate]].map(([l, v]) => (
              <div key={l}><p className="text-xs font-bold uppercase tracking-widest text-navy-400">{l}</p><p className="mt-1 text-sm font-bold text-navy-900">{v}</p></div>
            ))}
            <div><p className="text-xs font-bold uppercase tracking-widest text-navy-400">Valideyn</p><p className="mt-1 text-sm font-bold text-navy-900"><Link href={`/admin/parents/${s.parent.id}`} className="hover:text-electric-600">{s.parent.name}</Link></p><p className="text-xs text-navy-400">{s.parent.email}</p><ChangeParentDialog studentId={s.id} currentParentId={s.parent.id} studentName={s.name} /></div>
          </div>
        </div>
        <section className={card}>
          <h2 className="px-6 pt-5 text-base font-extrabold text-navy-900">Siniflər</h2>
          <div className="overflow-x-auto"><table className="mt-2 w-full text-sm"><thead><tr className="border-b border-navy-100"><th className={th}>Sinif</th><th className={th}>Müəllim</th><th className={th}>Status</th><th className={th}>Tamamlanan dərs</th><th className={th}>Qoşulub</th></tr></thead>
            <tbody>
              {s.classes.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-navy-400">Heç bir sinifdə deyil.</td></tr>}
              {s.classes.map((c) => <tr key={c.id} className="border-b border-navy-50 last:border-0"><td className="px-4 py-3"><Link className="font-bold hover:text-electric-600" href={`/admin/classes/${c.id}`}>{c.name}</Link></td><td className="px-4 py-3 text-navy-600">{c.teacher}</td><td className="px-4 py-3 text-navy-600">{c.status === "ACTIVE" ? "Aktiv" : "Arxivdə"}</td><td className="px-4 py-3 font-bold">{c.completedLessons}</td><td className="px-4 py-3 text-xs text-navy-400">{fmtDate(c.joinedAt)}</td></tr>)}
            </tbody></table></div>
        </section>
        <section className={card}>
          <h2 className="px-6 pt-5 text-base font-extrabold text-navy-900">Davamiyyət (son 40)</h2>
          <div className="overflow-x-auto"><table className="mt-2 w-full text-sm"><thead><tr className="border-b border-navy-100"><th className={th}>Tarix</th><th className={th}>Sinif</th><th className={th}>Status</th><th className={th}>Qeyd</th></tr></thead>
            <tbody>
              {s.attendance.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-navy-400">Davamiyyət qeydi yoxdur.</td></tr>}
              {s.attendance.map((a) => <tr key={a.id} className="border-b border-navy-50 last:border-0"><td className="px-4 py-3 text-xs text-navy-400">{fmtDate(a.date)}</td><td className="px-4 py-3">{a.className}</td><td className="px-4 py-3"><Badge variant={ATT[a.status].v}>{ATT[a.status].label}</Badge></td><td className="px-4 py-3 text-navy-600">{a.note ?? ""}</td></tr>)}
            </tbody></table></div>
        </section>
        <section className={`${card} p-6`}>
          <h2 className="text-base font-extrabold text-navy-900">Müəllim qeydləri</h2>
          {s.notes.length === 0 && <p className="mt-3 text-sm text-navy-400">Qeyd yoxdur.</p>}
          <ul className="mt-3 space-y-3">
            {s.notes.map((n) => <li key={n.id} className="rounded-xl bg-navy-50 p-4 text-sm"><div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-navy-400"><b className="text-navy-900">{n.teacher}</b> · {fmtDate(n.createdAt)} · <Badge variant={n.visibility === "PARENT" ? "primary" : "default"}>{n.visibility === "PARENT" ? "Valideynə görünür" : "Daxili qeyd"}</Badge></div>{n.body}</li>)}
          </ul>
        </section>
        <section className={card}>
          <h2 className="px-6 pt-5 text-base font-extrabold text-navy-900">Ödəniş tarixçəsi</h2>
          <div className="overflow-x-auto"><table className="mt-2 w-full text-sm"><thead><tr className="border-b border-navy-100"><th className={th}>Sinif</th><th className={th}>Dövr</th><th className={th}>Məbləğ</th><th className={th}>Status</th><th className={th}>Vaxtı çatıb</th><th className={th}>Ödənilib</th><th className={th}></th></tr></thead>
            <tbody>
              {s.payments.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-navy-400">Ödəniş qeydi yoxdur.</td></tr>}
              {s.payments.map((p) => <tr key={p.id} className="border-b border-navy-50 last:border-0"><td className="px-4 py-3">{p.className ?? "—"}</td><td className="px-4 py-3">{p.cycle ?? "—"}</td><td className="px-4 py-3">{p.amount} AZN</td><td className="px-4 py-3"><PaymentBadge status={p.status} /></td><td className="px-4 py-3 text-xs text-navy-400">{fmtDate(p.dueDate)}</td><td className="px-4 py-3 text-xs text-navy-400">{fmtDate(p.paidAt)}</td><td className="px-4 py-3">{p.cycle !== null && <PaymentActions id={p.id} status={p.status} />}</td></tr>)}
            </tbody></table></div>
        </section>
      </div>
    </div>
  );
}
