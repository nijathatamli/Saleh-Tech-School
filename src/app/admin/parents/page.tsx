import Link from "next/link";
import { listParents } from "@/lib/admin/parents";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Avatar } from "@/components/ui/avatar";
import { CreateParentDialog } from "@/components/admin/parent-dialogs";
import { Pagination, card, th, EmptyState } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { adminGuard } from "@/lib/admin/guard";
import { cleanQ } from "@/lib/search";
export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminParentsPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const data = await listParents({ q: cleanQ(searchParams.q), page, size: SIZE });
  return (
    <div>
      <AdminTopbar title="Valideynlər" subtitle="Hesablar və bağlı övladlar" />
      <div className="space-y-6 ap-content">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
            <input name="q" defaultValue={searchParams.q} placeholder="Ad, e-poçt və ya telefon..." className="w-64 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
            <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
          </form>
          <CreateParentDialog />
        </div>
        <div className={card}>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Valideyn</th><th className={th}>Telefon</th><th className={th}>Övladlar</th><th className={th}>Status</th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={4} className="px-4 py-4"><EmptyState text="Valideyn tapılmadı." hint="Axtarışı və ya filtrləri dəyişməyi sınayın." /></td></tr>}
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/50">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar name={p.name} size={34} /><div className="min-w-0"><Link href={`/admin/parents/${p.id}`} className="font-bold text-navy-900 hover:text-electric-600">{p.name}</Link><p className="text-xs text-navy-400">{p.email}</p></div></div></td>
                    <td className="px-4 py-3 text-navy-600">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-navy-600">{p.children.length ? p.children.map((c, i) => <span key={c.id}>{i > 0 && ", "}<Link href={`/admin/students/${c.id}`} className="hover:text-electric-600">{c.name}</Link></span>) : "—"}</td>
                    <td className="px-4 py-3"><Badge variant={p.active ? "success" : "default"}>{p.active ? "Aktiv" : "Deaktiv"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/admin/parents" params={{ q: searchParams.q }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
