import Link from "next/link";
import { listPayments } from "@/lib/admin/payments";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { PaymentActions } from "@/components/admin/payment-actions";
import { PaymentBadge, Pagination, card, fmtDate, th } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: { status?: string; q?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = ["DUE", "OVERDUE", "PAID", "CANCELLED", "ALL"].includes(searchParams.status ?? "") ? searchParams.status! : "DUE";
  const data = await listPayments({ status, q: searchParams.q?.trim() || undefined, page, size: SIZE });

  return (
    <div>
      <AdminTopbar title="Ödənişlər" subtitle="Dərs əsaslı ödəniş dövrləri" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 sm:grid-cols-4">
          {[["DUE", "Ödəniş vaxtıdır"], ["OVERDUE", "Gecikmiş"], ["PAID", "Ödənilib"], ["CANCELLED", "Ləğv edilib"]].map(([k, l]) => (
            <Link key={k} href={`/admin/payments?status=${k}`} className={`${card} p-5 transition-colors hover:border-electric-500 ${status === k ? "border-electric-500" : ""}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-navy-400">{l}</p>
              <p className="mt-2 text-3xl font-extrabold text-navy-900">{data.counts[k] ?? 0}</p>
            </Link>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Tələbə</th><th className={th}>Sinif</th><th className={th}>Dərslər</th><th className={th}>Məbləğ</th><th className={th}>Status</th><th className={th}>Vaxtı çatıb</th><th className={th}>Ödənilib</th><th className={th}></th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-navy-400">Ödəniş tapılmadı.</td></tr>}
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3">{p.studentId ? <Link href={`/admin/students/${p.studentId}`} className="font-bold hover:text-electric-600">{p.studentName}</Link> : p.studentName}</td>
                    <td className="px-4 py-3">{p.classId ? <Link href={`/admin/classes/${p.classId}`} className="hover:text-electric-600">{p.className}</Link> : p.className}</td>
                    <td className="px-4 py-3 text-navy-600">{p.lessonsFrom}–{p.lessonsTo} <span className="text-xs text-navy-400">({p.cycle}-ci dövr)</span></td>
                    <td className="px-4 py-3 font-bold">{p.amount} AZN</td>
                    <td className="px-4 py-3"><PaymentBadge status={p.overdue ? "OVERDUE" : p.status} /></td>
                    <td className="px-4 py-3 text-xs text-navy-400">{fmtDate(p.dueAt)}</td>
                    <td className="px-4 py-3 text-xs text-navy-400">{fmtDate(p.paidAt)}</td>
                    <td className="px-4 py-3"><PaymentActions id={p.id} status={p.status} /></td>
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
