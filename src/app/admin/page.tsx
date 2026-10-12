import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDashboard } from "@/lib/admin/reports";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { GreetingBanner } from "@/components/app/greeting-banner";
import { AdminBarChart } from "@/components/app/bar-chart";
import { card, fmtDate } from "@/components/admin/bits";
import { formatAzn } from "@/lib/utils";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";

const stageLabels: Record<string, string> = { NEW: "Yeni", CONTACTED: "Əlaqə", TRIAL_LESSON: "Sınaq", TRIAL_COMPLETED: "Bitib", INTERESTED: "Maraqlı", REGISTERED: "Qeydiyyat", REJECTED: "Rədd" };
const hhmm = (iso: string) => new Intl.DateTimeFormat("az-AZ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baku" }).format(new Date(iso));

function Stat({ label, value, href, tone }: { label: string; value: string | number; href?: string; tone?: "warn" | "bad" }) {
  const body = (
    <div className={`${card} p-5 transition-colors ${href ? "hover:border-electric-500" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-navy-400">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${tone === "bad" ? "text-red-600" : tone === "warn" ? "text-amber-600" : "text-navy-900"}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminDashboardPage() {
  await adminGuard();
  const session = await getServerSession(authOptions);
  const d = await getDashboard();
  const byStage = await prisma.trialBooking.groupBy({ by: ["stage"], _count: { _all: true } });
  const chart = Object.entries(stageLabels).map(([stage, label]) => ({ label, value: byStage.find((b) => b.stage === stage)?._count._all ?? 0 }));

  return (
    <div>
      <AdminTopbar title="Admin Dashboard" subtitle="Məktəbin əməliyyat mərkəzi" />
      <div className="space-y-8 p-6 md:p-10">
        <GreetingBanner name={(session?.user?.name ?? "Admin").split(" ")[0]} subtitle="Bu günün və yaxın günlərin əsas göstəriciləri." />

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-navy-400">Məktəb</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Aktiv tələbələr" value={d.activeStudents} href="/admin/students?active=true" />
            <Stat label="Aktiv müəllimlər" value={d.activeTeachers} href="/admin/teachers" />
            <Stat label="Aktiv siniflər" value={d.activeClasses} href="/admin/classes" />
            <Stat label="Bu günkü dərslər" value={d.todayLessons.length} href="/admin/schedule" />
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-navy-400">Diqqət tələb edir</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Bu gün qayıb / üzrlü" value={d.todayAbsent} href="/admin/attendance?status=ABSENT" tone={d.todayAbsent ? "warn" : undefined} />
            <Stat label="Ödəniş vaxtı çatıb" value={`${d.paymentsDue.count} · ${formatAzn(d.paymentsDue.amount)}`} href="/admin/payments?status=DUE" tone={d.paymentsDue.count ? "warn" : undefined} />
            <Stat label={`Gecikmiş (${d.overdueAfterDays}+ gün)`} value={d.paymentsOverdue} href="/admin/payments?status=OVERDUE" tone={d.paymentsOverdue ? "bad" : undefined} />
            <Stat label="Yeni müraciətlər" value={d.newApplications} href="/admin/leads?stage=NEW" tone={d.newApplications ? "warn" : undefined} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Bu ay ödənilib" value={formatAzn(d.monthRevenue)} href="/admin/reports" />
          <Stat label="Müraciət (son 7 gün)" value={d.applications7d} href="/admin/leads" />
          <Stat label="Təqaüd qeydiyyatı (7 gün)" value={d.scholarshipRegistrations7d} href="/admin/scholarship" />
          <Stat label="Təqaüd imtahanını bitirən" value={d.scholarshipFinished} href="/admin/scholarship" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`${card} p-6`}>
            <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-base text-navy-900">Bu günün dərsləri</h3><Link href="/admin/schedule" className="text-xs font-bold text-electric-600 hover:underline">Cədvəl</Link></div>
            <ul className="divide-y divide-navy-50 text-sm">
              {d.todayLessons.length === 0 && <li className="py-6 text-center text-navy-400">Bu gün dərs yoxdur.</li>}
              {d.todayLessons.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-3"><div><Link href={`/admin/classes/${l.classId}`} className="font-bold text-navy-900 hover:text-electric-600">{l.className}</Link><p className="text-xs text-navy-400">{l.teacherName}{l.room ? ` · ${l.room}` : ""}</p></div><span className="font-bold tabular-nums">{hhmm(l.date)}</span></li>
              ))}
            </ul>
          </section>
          <section className={`${card} p-6`}>
            <h3 className="mb-4 font-display text-base text-navy-900">Müəllim yükü (növbəti 7 gün)</h3>
            <ul className="divide-y divide-navy-50 text-sm">
              {d.teacherLoad.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3"><Link href={`/admin/teachers/${t.id}`} className="font-bold text-navy-900 hover:text-electric-600">{t.name}</Link><span className="text-navy-600">{t.lessonsWeek} dərs · {t.students} tələbə</span></li>
              ))}
            </ul>
            {d.fullClasses.length > 0 && (
              <>
                <h3 className="mb-2 mt-6 font-display text-base text-navy-900">Dolmaq üzrə olan siniflər</h3>
                <ul className="text-sm">
                  {d.fullClasses.map((c) => <li key={c.id} className="flex justify-between py-1.5"><Link href={`/admin/classes/${c.id}`} className="hover:text-electric-600">{c.name}</Link><span className="font-bold text-amber-700">{c.students} / {c.capacity}</span></li>)}
                </ul>
              </>
            )}
          </section>
        </div>

        <section className="rounded-3xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] md:p-8">
          <div className="mb-6 flex items-center justify-between"><h3 className="font-display text-base text-navy-900">Qəbul pipeline-ı</h3><Link href="/admin/leads" className="text-xs font-bold text-electric-600 hover:underline">Bütün müraciətlər</Link></div>
          <AdminBarChart data={chart} />
        </section>
      </div>
    </div>
  );
}
