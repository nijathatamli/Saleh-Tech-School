import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppTopbar } from "@/components/app/topbar";
import { getScholarshipAdminData } from "@/lib/scholarship/admin";
import { SCHOLARSHIP_NAME } from "@/lib/scholarship/config";
import { formatCourseCode } from "@/lib/scholarship/security";
import { GenerateCodesForm } from "./generate-form";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("az-AZ", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Baku" });
const STATUS = { NOT_STARTED: "Başlamayıb", IN_PROGRESS: "İmtahan davam edir", SUBMITTED: "Tamamlayıb" } as const;

export default async function AdminScholarshipPage() {
  const session = await getServerSession(authOptions);
  const { students, codes } = await getScholarshipAdminData();
  const done = students.filter((s) => s.status === "SUBMITTED");
  const unused = codes.filter((c) => !c.usedAt);

  return (
    <div>
      <AppTopbar title={`${SCHOLARSHIP_NAME} — təqaüd imtahanı`} userName={session?.user?.name ?? "Admin"} userEmail={session?.user?.email ?? ""} />

      <div className="space-y-8 p-6 md:p-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Qeydiyyatdan keçən", v: students.length },
            { l: "İmtahanı bitirən", v: done.length },
            { l: "İşlənməmiş kodlar", v: unused.length },
            { l: "Təqaüd verilən", v: done.length },
          ].map((c) => (
            <div key={c.l} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-sm shadow-navy-900/[0.03]">
              <p className="text-xs font-bold uppercase tracking-widest text-navy-400">{c.l}</p>
              <p className="mt-2 text-3xl font-extrabold">{c.v}</p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <h2 className="mb-1 text-lg font-extrabold">Kurs kodları</h2>
          <p className="mb-6 text-sm text-navy-400">
            İmtahana yalnız kursun tələbələri qatıla bilər: qeydiyyat 32 simvolluq birdəfəlik kod tələb edir. Kodu tələbəyə siz verirsiniz.
          </p>
          <GenerateCodesForm />

          <details className="mt-8">
            <summary className="cursor-pointer text-sm font-bold text-navy-900">Son kodlar ({codes.length})</summary>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-left text-xs font-bold uppercase tracking-widest text-navy-400">
                    <th className="px-4 py-3">Kod</th>
                    <th className="px-4 py-3">Qeyd</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-b border-navy-50 last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{formatCourseCode(c.code)}</td>
                      <td className="px-4 py-3 text-navy-600">{c.note ?? "—"}</td>
                      <td className="px-4 py-3 text-navy-600">{c.usedAt ? `İstifadə olunub — ${c.usedBy ?? ""}` : "Boşdur"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>

        <section className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-extrabold">Tələbələr və nəticələr</h2>
            <p className="mt-1 text-sm text-navy-400">İmtahanı bitirən hər tələbəyə minimum 60% təqaüd verilir; yüksək nəticə daha çox qazandırır (cədvəl <code>SCHOLARSHIP_TIERS</code>, src/lib/scholarship/config.ts).</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs font-bold uppercase tracking-widest text-navy-400">
                  <th className="px-4 py-3">Tələbə</th>
                  <th className="px-4 py-3">Sinif</th>
                  <th className="px-4 py-3">FIN</th>
                  <th className="px-4 py-3">Telefon</th>
                  <th className="px-4 py-3">E-poçt</th>
                  <th className="px-4 py-3">Dil</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Nəticə</th>
                  <th className="px-4 py-3">Fənlər üzrə</th>
                  <th className="px-4 py-3">Təqaüd</th>
                  <th className="px-4 py-3">Tarix</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-navy-400">Hələ qeydiyyat yoxdur.</td></tr>
                )}
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-navy-50 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-bold">{s.name} {s.surname}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-navy-600">{s.category}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.fin}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-navy-600">{s.phone}</td>
                    <td className="px-4 py-3 text-navy-600">{s.email}</td>
                    <td className="px-4 py-3 text-navy-600 uppercase">{s.language}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-navy-600">{STATUS[s.status]}{s.timedOut ? " (vaxt bitdi)" : ""}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold">{s.status === "SUBMITTED" ? `${s.score} / ${s.total} (${s.percent}%)` : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy-600">{s.subjects.length ? s.subjects.map((x) => `${x.label} ${x.correct}/${x.total}`).join(" · ") : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-extrabold text-electric-600">{s.status === "SUBMITTED" ? `${s.scholarshipPercent}%` : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy-600">{fmt.format(s.finishedAt ?? s.registeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
