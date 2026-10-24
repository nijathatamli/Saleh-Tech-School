import Link from "next/link";
import { notFound } from "next/navigation";
import { getParent } from "@/lib/admin/parents";
import { ApiError } from "@/lib/api";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { EditParentDialog } from "@/components/admin/parent-dialogs";
import { ActiveToggle } from "@/components/admin/teacher-dialogs";
import { card } from "@/components/admin/bits";
import { Badge } from "@/components/ui/badge";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";

export default async function AdminParentPage({ params }: { params: { id: string } }) {
  await adminGuard();
  const p = await getParent(params.id).catch((e) => {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  });
  if (!p) notFound();
  return (
    <div>
      <AdminTopbar title={p.name} subtitle="Valideyn profili" />
      <div className="space-y-6 p-6 md:p-10">
        <Link href="/admin/parents" className="text-sm font-bold text-electric-600 hover:underline">← Bütün valideynlər</Link>
        <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
          <div className="space-y-1 text-sm">
            <p><span className="text-navy-400">E-poçt:</span> <b>{p.email}</b></p>
            <p><span className="text-navy-400">Telefon:</span> <b>{p.phone ?? "—"}</b></p>
            <p><span className="text-navy-400">Gözləyən ödənişlər:</span> <b>{p.paymentsDue}</b> {p.paymentsDue > 0 && <Link href="/admin/payments?status=DUE" className="font-bold text-electric-600 hover:underline">bax</Link>}</p>
            <Badge variant={p.active ? "success" : "default"}>{p.active ? "Aktiv" : "Deaktiv"}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3"><EditParentDialog parent={{ id: p.id, name: p.name, phone: p.phone }} /><ActiveToggle endpoint={`/api/admin/parents/${p.id}`} active={p.active} label="Valideyn" /></div>
        </div>
        <div className={`${card} p-6`}>
          <h2 className="mb-4 text-lg font-extrabold text-navy-900">Övladlar</h2>
          {p.children.length === 0 && <p className="text-sm text-navy-400">Bağlı övlad yoxdur.</p>}
          <ul className="divide-y divide-navy-50">
            {p.children.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div><Link href={`/admin/students/${c.id}`} className="font-bold text-navy-900 hover:text-electric-600">{c.name}</Link><p className="text-xs text-navy-400">{c.grade ? `${c.grade}-ci sinif` : "Sinif göstərilməyib"} · {c.classes.length ? c.classes.map((k) => `${k.name} (${k.teacher})`).join(", ") : "Sinfə yazılmayıb"}</p></div>
                <Badge variant={c.active ? "success" : "default"}>{c.active ? "Aktiv" : "Deaktiv"}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
