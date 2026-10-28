import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Layers, Minus, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getDashboard, getDashboardSeries } from "@/lib/admin/reports";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { DualBars, Donut, Spark, BLUE, MINT, AMBER, PURPLE, RED } from "@/components/admin/charts";
import { card, EmptyState } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";
import { formatAzn } from "@/lib/utils";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";

const STAGES: [string, string, string][] = [
  ["NEW", "Yeni", BLUE], ["CONTACTED", "Əlaqə", MINT], ["TRIAL_LESSON", "Sınaq dərsi", AMBER], ["TRIAL_COMPLETED", "Sınaq bitib", PURPLE],
  ["INTERESTED", "Maraqlı", "#06b6d4"], ["REGISTERED", "Qeydiyyat", "#16a34a"], ["REJECTED", "Rədd", RED],
];
const hhmm = (iso: string) => new Intl.DateTimeFormat("az-AZ", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Baku" }).format(new Date(iso));
const LESSON_STATUS: Record<string, [string, "success" | "default" | "primary" | "warning"]> = { SCHEDULED: ["Planlaşdırılıb", "primary"], COMPLETED: ["Keçirilib", "success"], IN_PROGRESS: ["Gedir", "warning"], CANCELLED: ["Ləğv", "default"] };

/** "↗ 22.8%" / "↘ 0.9%" under a number; the colour says better / worse, `text` says compared to what. */
function Delta({ now, before, unit = "%", text, goodWhenDown = false }: { now: number; before: number; unit?: "%" | "abs"; text: string; goodWhenDown?: boolean }) {
  const diff = unit === "%" ? (before ? Math.round(((now - before) / before) * 1000) / 10 : now ? 100 : 0) : now - before;
  const up = diff > 0, down = diff < 0;
  const good = goodWhenDown ? down : up;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <p className={`t-delta ${diff === 0 ? "ad-flat0" : good ? "ad-up" : "ad-down"}`}>
      <Icon aria-hidden="true" />
      <span>{up ? "+" : ""}{unit === "%" ? `${diff}%` : diff}</span>
      <span className="font-medium text-navy-400">{text}</span>
    </p>
  );
}

function Tile({ label, value, href, tone, hint, children }: { label: string; value: string | number; href?: string; tone: "blue" | "violet" | "lilac" | "mint" | "sand"; hint?: string; children?: React.ReactNode }) {
  const body = (
    <>
      <div className="t-top"><span>{label}</span>{hint && <em>{hint}</em>}</div>
      <p className="t-num">{value}</p>
      {children}
    </>
  );
  return href ? <Link href={href} className="ad-tile" data-tone={tone}>{body}</Link> : <div className="ad-tile" data-tone={tone}>{body}</div>;
}

export default async function AdminDashboardPage() {
  await adminGuard();
  const [d, series, byStage] = await Promise.all([getDashboard(), getDashboardSeries(), prisma.trialBooking.groupBy({ by: ["stage"], _count: { _all: true } })]);
  const stage = STAGES.map(([key, name, color]) => ({ name, color, value: byStage.find((b) => b.stage === key)?._count._all ?? 0 }));
  const stageTotal = stage.reduce((s, x) => s + x.value, 0);
  const registered = stage.find((s) => s.name === "Qeydiyyat")?.value ?? 0;
  const bars = series.days.map((x) => ({ label: x.label, a: x.revenue, b: x.applications }));
  const weekRevenue = series.days.reduce((s, x) => s + x.revenue, 0);
  const week = (k: "applications" | "absences" | "invoices") => series.days.reduce((s, x) => s + x[k], 0);

  return (
    <div>
      <AdminTopbar title="Dashboard" subtitle="Məktəbin əməliyyat mərkəzi" />
      <div className="ad-content space-y-4">
        <div className="ad-grid dash">
          <div className="min-w-0 space-y-4">
            <div className="ad-tiles">
              <Tile label="Aktiv tələbələr" value={d.activeStudents} href="/admin/students?active=true" tone="blue" hint="Hamısı">
                <Delta now={series.studentsNew7d} before={0} unit="abs" text="son 7 gündə yeni" />
              </Tile>
              <Tile label="Müraciətlər" value={d.applications7d} href="/admin/leads" tone="violet" hint="Bu həftə">
                <Delta now={d.applications7d} before={series.applicationsPrev7d} text="keçən həftəyə görə" />
              </Tile>
              <Tile label="Bu ay ödənilib" value={formatAzn(d.monthRevenue)} href="/admin/reports" tone="lilac" hint="Ay">
                <Delta now={d.monthRevenue} before={series.prevMonthRevenue} text="keçən aya görə" />
              </Tile>
            </div>

            <section className={`${card} p-5`} aria-label="Gəlir və müraciətlər">
              <div className="ad-panel-title">
                <h2>Gəlir və müraciətlər</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="ad-legend"><span><i style={{ background: BLUE }} />Gəlir (AZN)</span><span><i style={{ background: MINT }} />Müraciət</span></div>
                  <span className="ad-pillselect">Son 7 gün</span>
                </div>
              </div>
              <DualBars data={bars} aName="Gəlir" bName="Müraciət" />
              <p className="mt-2 text-xs text-navy-400">Son 7 gündə ödənilib: <b className="text-navy-900">{formatAzn(weekRevenue)}</b> · yeni müraciət: <b className="text-navy-900">{week("applications")}</b></p>
            </section>

            <section className={`${card} ad-flat p-5`} aria-label="Bu günün dərsləri">
              <div className="ad-panel-title">
                <h2>Bu günün dərsləri</h2>
                <Link href="/admin/schedule" className="text-xs font-semibold text-electric-600 hover:underline">Cədvəl</Link>
              </div>
              <div className="table-scroll overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className="px-3 py-2.5 text-left text-xs font-semibold">Sinif</th><th className="px-3 py-2.5 text-left text-xs font-semibold">Müəllim</th><th className="px-3 py-2.5 text-left text-xs font-semibold">Saat</th><th className="px-3 py-2.5 text-left text-xs font-semibold">Otaq</th><th className="px-3 py-2.5 text-left text-xs font-semibold">Status</th></tr></thead>
                  <tbody>
                    {d.todayLessons.length === 0 && <tr><td colSpan={5} className="px-3 py-3"><EmptyState text="Bu gün dərs yoxdur." /></td></tr>}
                    {d.todayLessons.map((l) => {
                      const [txt, variant] = LESSON_STATUS[l.status] ?? [l.status, "default" as const];
                      return (
                        <tr key={l.id}>
                          <td className="px-3 py-3"><Link href={`/admin/classes/${l.classId}`} className="font-semibold text-navy-900 hover:text-electric-600">{l.className}</Link></td>
                          <td className="px-3 py-3 text-navy-600">{l.teacherName}</td>
                          <td className="px-3 py-3 font-semibold tabular-nums">{hhmm(l.date)}</td>
                          <td className="px-3 py-3 text-navy-600">{l.room ?? "—"}</td>
                          <td className="px-3 py-3"><Badge variant={variant}>{txt}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { t: "Müraciətlər", sub: `${week("applications")} son 7 gündə`, href: "/admin/leads", color: BLUE, v: series.days.map((x) => x.applications) },
                { t: "Qayıblar", sub: `${week("absences")} son 7 gündə`, href: "/admin/attendance?status=ABSENT", color: "#10b981", v: series.days.map((x) => x.absences) },
                { t: "Yeni qaimələr", sub: `${week("invoices")} son 7 gündə`, href: "/admin/payments", color: RED, v: series.days.map((x) => x.invoices) },
              ].map((c) => (
                <Link key={c.t} href={c.href} className="ad-sparkcard">
                  <h3>{c.t}</h3>
                  <p>{c.sub}</p>
                  <div className="s-row">
                    <span className="s-link">Ətraflı bax</span>
                    <Spark values={c.v} color={c.color} label={`${c.t}: son 7 günün qrafiki`} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <section className={`${card} p-5`} aria-label="Müraciət mərhələləri">
              <div className="ad-panel-title"><h2>Müraciət mərhələləri</h2><Link href="/admin/leads" className="text-xs font-semibold text-electric-600 hover:underline">Hamısı</Link></div>
              <Donut data={stage} label={`Müraciətlər mərhələlərə görə: ${stage.map((s) => `${s.name} ${s.value}`).join(", ")}`} />
              <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-navy-600">
                {stage.map((s) => (
                  <li key={s.name} className="flex items-center gap-2"><i aria-hidden="true" className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} /><span className="truncate">{s.name}</span><b className="ml-auto text-navy-900 tabular-nums">{s.value}</b></li>
                ))}
              </ul>
              <div className="ad-summary mt-4">
                <b>{stageTotal ? Math.round((registered / stageTotal) * 100) : 0}%</b>
                <span>Qeydiyyata çevrilmə<br />{registered} / {stageTotal} müraciət</span>
              </div>
            </section>

            <section className={`${card} p-5`} aria-label="Tez əməliyyatlar">
              <div className="ad-panel-title"><h2>Tez əməliyyatlar</h2></div>
              <div className="ad-quick">
                <Link href="/admin/students?yarat=telebe"><UserPlus aria-hidden="true" /><span>Yeni tələbə yarat</span></Link>
                <Link href="/admin/classes?yarat=sinif"><Layers aria-hidden="true" /><span>Yeni sinif yarat</span></Link>
              </div>
              <div className="ad-mint-box mt-4">
                <Link href="/admin/payments?status=DUE" className="block">
                  <p className="text-xs font-semibold text-navy-900">Ödəniş vaxtı çatıb</p>
                  <p className="mt-1 text-xl font-bold text-[#0f9d63]">{d.paymentsDue.count} qaimə</p>
                  <p className="mt-1 text-xs text-navy-400">Cəmi {formatAzn(d.paymentsDue.amount)}</p>
                </Link>
                <Link href="/admin/payments?status=OVERDUE" className="block">
                  <p className="text-xs font-semibold text-navy-900">Gecikmiş ({d.overdueAfterDays}+ gün)</p>
                  <p className="mt-1 text-xl font-bold text-[#d92d56]">{d.paymentsOverdue} qaimə</p>
                  <p className="mt-1 text-xs text-navy-400">Yeni müraciət: {d.newApplications}</p>
                </Link>
              </div>
            </section>
          </div>
        </div>

        <div className="ad-tiles">
          <Tile label="Aktiv siniflər" value={d.activeClasses} href="/admin/classes" tone="mint" />
          <Tile label="Aktiv müəllimlər" value={d.activeTeachers} href="/admin/teachers" tone="blue" />
          <Tile label="Bu günkü dərslər" value={d.todayLessons.length} href="/admin/schedule" tone="violet" />
          <Tile label="Bu gün qayıb / üzrlü" value={d.todayAbsent} href="/admin/attendance?status=ABSENT" tone="sand" />
          <Tile label="Təqaüd qeydiyyatı (7 gün)" value={d.scholarshipRegistrations7d} href="/admin/scholarship" tone="lilac" />
          <Tile label="Təqaüd imtahanını bitirən" value={d.scholarshipFinished} href="/admin/scholarship" tone="mint" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className={`${card} p-5`}>
            <div className="ad-panel-title"><h2>Müəllim yükü (növbəti 7 gün)</h2></div>
            <ul className="divide-y divide-navy-50 text-sm">
              {d.teacherLoad.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5"><Link href={`/admin/teachers/${t.id}`} className="font-semibold text-navy-900 hover:text-electric-600">{t.name}</Link><span className="text-navy-600">{t.lessonsWeek} dərs · {t.students} tələbə</span></li>
              ))}
            </ul>
          </section>
          <section className={`${card} p-5`}>
            <div className="ad-panel-title"><h2>Dolmaq üzrə olan siniflər</h2></div>
            {d.fullClasses.length === 0 ? (
              <EmptyState text="Dolmağa yaxın sinif yoxdur." />
            ) : (
              <ul className="divide-y divide-navy-50 text-sm">
                {d.fullClasses.map((c) => <li key={c.id} className="flex items-center justify-between py-2.5"><Link href={`/admin/classes/${c.id}`} className="font-semibold text-navy-900 hover:text-electric-600">{c.name}</Link><span className="font-semibold text-amber-700">{c.students}/{c.capacity}</span></li>)}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
