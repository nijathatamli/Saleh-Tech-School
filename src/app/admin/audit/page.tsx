import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Pagination, card, fmtDate, th, EmptyState } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";
const SIZE = 30;

export default async function AdminAuditPage({ searchParams }: { searchParams: { action?: string; entityType?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const where: Prisma.AuditLogWhereInput = {
    ...(searchParams.action?.trim() ? { action: { startsWith: searchParams.action.trim() } } : {}),
    ...(searchParams.entityType ? { entityType: searchParams.entityType } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, include: { actor: { select: { name: true, role: true } } } }),
  ]);
  return (
    <div>
      <AdminTopbar title="Audit jurnalı" subtitle="Kim nəyi nə vaxt dəyişdi" />
      <div className="space-y-6 p-6 md:p-10">
        <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
          <input name="action" defaultValue={searchParams.action} placeholder="Əməliyyat (məs. class., payment., lesson.)" className="w-72 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
          <select name="entityType" defaultValue={searchParams.entityType ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Obyekt">
            <option value="">Bütün obyektlər</option>
            {["class", "student", "payment", "attendance", "lesson", "user", "homework", "grade", "note"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button type="submit" variant="app-outline" size="sm">Filtr</Button>
        </form>
        <div className={card}>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Vaxt</th><th className={th}>İstifadəçi</th><th className={th}>Əməliyyat</th><th className={th}>Obyekt</th><th className={th}>Təfərrüat</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-4"><EmptyState text="Qeyd yoxdur." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></td></tr>}
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-navy-50 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy-400">{fmtDate(r.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.actor.name} <span className="text-xs text-navy-400">({r.actor.role})</span></td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold">{r.action}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-navy-600">{r.entityType} · {r.entityId.slice(0, 10)}</td>
                    <td className="max-w-md px-4 py-3 text-xs text-navy-600"><code className="line-clamp-2 break-all">{JSON.stringify(r.after ?? r.before ?? {})}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/audit" params={{ action: searchParams.action, entityType: searchParams.entityType }} page={page} total={total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
