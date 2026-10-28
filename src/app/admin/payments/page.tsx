import Link from "next/link";
import { StatTile } from "@/components/admin/bits";
import { listPayments } from "@/lib/admin/payments";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { PaymentActions } from "@/components/admin/payment-actions";
import { PaymentBadge, Pagination, card, fmtDate, th, EmptyState } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
import { cleanQ } from "@/lib/search";
export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { status?: string; q?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = ["DUE", "OVERDUE", "PAID", "CANCELLED", "ALL"].includes(searchParams.status ?? "") ? searchParams.status! : "DUE";
  const data = await listPayments({ status, q: cleanQ(searchParams.q), page, size: SIZE });

  return (
    <div>
      <AdminTopbar title="Ödənişlər" subtitle="Dərs əsaslı ödəniş dövrləri" />
      <div className="space-y-6 ap-content">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          {[["DUE", "Ödəniş vaxtıdır"], ["OVERDUE", "Gecikmiş"], ["PAID", "Ödənilib"], ["CANCELLED", "Ləğv edilib"]].map(([k, l], i) => (
            <StatTile key={k} href={`/admin/payments?status=${k}`} label={l} value={data.counts[k] ?? 0} tone={(["sand", "lilac", "mint", "blue"] as const)[i]} active={status === k} />
          ))}
        </div>
        <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
          <input name="q" defaultValue={searchParams.q} placeholder="Tələbə, sinif və ya qaimə nömrəsi..." className="w-72 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
          <select name="status" defaultValue={status} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Status">
            <option value="DUE">Ödəniş vaxtıdır</option><option value="OVERDUE">Gecikmiş</option><option value="PAID">Ödənilib</option><option value="CANCELLED">Ləğv edilib</option><option value="ALL">Hamısı</option>
          </select>
          <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
        </form>
        <div className={card}>
          {/* phone: one card per payment, so the amount, the status and the buttons are not hidden to the right of a wide table */}
          <ul className="divide-y divide-navy-50 md:hidden">
            {data.items.length === 0 && <li className="px-4 py-4"><EmptyState text="Ödəniş tapılmadı." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></li>}
            {data.items.map((p) => (
              <li key={p.id} className="space-y-3 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {p.studentId ? <Link href={`/admin/students/${p.studentId}`} className="hover:text-electric-600">{p.studentName}</Link> : p.studentName}
                      {p.studentActive === false && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-500">Bloklanıb</span>}
                    </p>
                    <p className="truncate text-xs text-navy-400">{p.classId ? <Link href={`/admin/classes/${p.classId}`} className="hover:text-electric-600">{p.className}</Link> : p.className} · {p.lessonsFrom}–{p.lessonsTo}-ci dərslər ({p.cycle}-ci dövr)</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-extrabold">{p.amount} AZN</p>
                    <PaymentBadge status={p.overdue ? "OVERDUE" : p.status} />
                  </div>
                </div>
                <p className="text-xs text-navy-400">Vaxtı çatıb: {fmtDate(p.dueAt)}{p.paidAt ? ` · Ödənilib: ${fmtDate(p.paidAt)}` : ""}</p>
                <PaymentActions id={p.id} status={p.status} studentId={p.studentId} studentActive={p.studentActive} />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Tələbə</th><th className={th}>Sinif</th><th className={th}>Dərslər</th><th className={th}>Məbləğ</th><th className={th}>Status</th><th className={th}>Vaxtı çatıb</th><th className={th}>Ödənilib</th><th className={th}></th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={8} className="px-4 py-4"><EmptyState text="Ödəniş tapılmadı." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></td></tr>}
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3">{p.studentId ? <Link href={`/admin/students/${p.studentId}`} className="font-bold hover:text-electric-600">{p.studentName}</Link> : p.studentName}{p.studentActive === false && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-500">Bloklanıb</span>}</td>
                    <td className="px-4 py-3">{p.classId ? <Link href={`/admin/classes/${p.classId}`} className="hover:text-electric-600">{p.className}</Link> : p.className}</td>
                    <td className="px-4 py-3 text-navy-600">{p.lessonsFrom}–{p.lessonsTo} <span className="text-xs text-navy-400">({p.cycle}-ci dövr)</span></td>
                    <td className="px-4 py-3 font-bold">{p.amount} AZN</td>
                    <td className="px-4 py-3"><PaymentBadge status={p.overdue ? "OVERDUE" : p.status} /></td>
                    <td className="px-4 py-3 text-xs text-navy-400">{fmtDate(p.dueAt)}</td>
                    <td className="px-4 py-3 text-xs text-navy-400">{fmtDate(p.paidAt)}</td>
                    <td className="px-4 py-3"><PaymentActions id={p.id} status={p.status} studentId={p.studentId} studentActive={p.studentActive} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/payments" params={{ status: searchParams.status, q: searchParams.q }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
