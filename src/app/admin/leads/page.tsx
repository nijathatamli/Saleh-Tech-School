import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LEAD_STAGES, listApplications } from "@/lib/admin/admissions";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { ConvertDialog, StageSelect } from "@/components/admin/admission-actions";
import { STAGE_LABEL } from "@/lib/admin/labels";
import { Pagination, card, fmtDate, th, EmptyState } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
import { cleanQ } from "@/lib/search";
export const dynamic = "force-dynamic";
const SIZE = 25;

export default async function AdminAdmissionsPage({ searchParams }: { searchParams: { q?: string; stage?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [data, classes] = await Promise.all([
    listApplications({ q: cleanQ(searchParams.q), stage: searchParams.stage || undefined, page, size: SIZE }),
    prisma.classGroup.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const tab = (stage: string | undefined, label: string, count?: number) => {
    const qs = new URLSearchParams({ ...(stage ? { stage } : {}), ...(searchParams.q ? { q: searchParams.q } : {}) });
    const on = (searchParams.stage ?? "") === (stage ?? "");
    return <Link key={label} href={`/admin/leads?${qs}`} className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-bold ${on ? "border-electric-500 bg-electric-50 text-electric-700" : "border-navy-100 bg-white text-navy-600 hover:bg-navy-50"}`}>{label}{count !== undefined ? ` · ${count}` : ""}</Link>;
  };
  const totalAll = Object.values(data.counts).reduce((a, b) => a + b, 0);
  return (
    <div>
      <AdminTopbar title="Qəbul / Müraciətlər" subtitle="Sınaq dərsi müraciətlərindən tələbəyə qədər" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap gap-2">{tab(undefined, "Hamısı", totalAll)}{LEAD_STAGES.map((s) => tab(s, STAGE_LABEL[s], data.counts[s] ?? 0))}</div>
        <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
          {searchParams.stage && <input type="hidden" name="stage" value={searchParams.stage} />}
          <input name="q" defaultValue={searchParams.q} placeholder="Valideyn, şagird və ya telefon..." className="w-72 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
          <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
        </form>
        <div className={card}>
          {/* phone: one card per request, so the stage and the "Tələbə yarat" button are not hidden to the right of a wide table */}
          <ul className="divide-y divide-navy-50 md:hidden">
            {data.items.length === 0 && <li className="px-4 py-4"><EmptyState text="Müraciət tapılmadı." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></li>}
            {data.items.map((a) => (
              <li key={a.id} className="space-y-3 px-4 py-4">
                <div>
                  <p className="font-bold text-navy-900">{a.studentName}</p>
                  <p className="text-xs text-navy-400">{a.studentAge} yaş · müraciət {fmtDate(a.createdAt)}</p>
                </div>
                <p className="text-sm text-navy-900">{a.parentName} <span className="text-xs text-navy-400">· {a.parentPhone}</span></p>
                <p className="text-xs text-navy-600">{a.courseName ?? "—"} · sınaq {fmtDate(a.preferredDate).split(",")[0]} {a.preferredTime}</p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>{a.stage === "REGISTERED" ? <Badge variant="success">{STAGE_LABEL.REGISTERED}</Badge> : <StageSelect id={a.id} stage={a.stage} />}</div>
                  <div>
                    {a.convertedStudentId ? <Link href={`/admin/students/${a.convertedStudentId}`} className="text-xs font-bold text-electric-600 hover:underline">Tələbəyə bax</Link> : a.stage !== "REJECTED" ? <ConvertDialog app={{ id: a.id, parentName: a.parentName, parentPhone: a.parentPhone, studentName: a.studentName, studentAge: a.studentAge }} classes={classes} /> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Şagird</th><th className={th}>Valideyn</th><th className={th}>Kurs</th><th className={th}>Sınaq vaxtı</th><th className={th}>Mərhələ</th><th className={th}></th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-4"><EmptyState text="Müraciət tapılmadı." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></td></tr>}
                {data.items.map((a) => (
                  <tr key={a.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3"><p className="font-bold text-navy-900">{a.studentName}</p><p className="text-xs text-navy-400">{a.studentAge} yaş · müraciət {fmtDate(a.createdAt)}</p></td>
                    <td className="px-4 py-3"><p className="text-navy-900">{a.parentName}</p><p className="text-xs text-navy-400">{a.parentPhone}</p></td>
                    <td className="px-4 py-3 text-navy-600">{a.courseName ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-navy-600">{fmtDate(a.preferredDate).split(",")[0]} · {a.preferredTime}</td>
                    <td className="px-4 py-3">{a.stage === "REGISTERED" ? <Badge variant="success">{STAGE_LABEL.REGISTERED}</Badge> : <StageSelect id={a.id} stage={a.stage} />}</td>
                    <td className="px-4 py-3 text-right">
                      {a.convertedStudentId ? <Link href={`/admin/students/${a.convertedStudentId}`} className="text-xs font-bold text-electric-600 hover:underline">Tələbəyə bax</Link> : a.stage !== "REJECTED" ? <ConvertDialog app={{ id: a.id, parentName: a.parentName, parentPhone: a.parentPhone, studentName: a.studentName, studentAge: a.studentAge }} classes={classes} /> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/leads" params={{ q: searchParams.q, stage: searchParams.stage }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
