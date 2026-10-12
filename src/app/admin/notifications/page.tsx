import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { MarkAllReadButton } from "@/components/admin/payment-actions";
import { Pagination, card, fmtDate } from "@/components/admin/bits";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";
const SIZE = 20;

const EVENT_LABEL: Record<string, string> = {
  PAYMENT_DUE: "Ödəniş vaxtı", PAYMENT_PAID: "Ödəniş qəbul", NEW_APPLICATION: "Yeni müraciət", NEW_STUDENT: "Yeni tələbə", NEW_SCHOLARSHIP_REGISTRATION: "Təqaüd qeydiyyatı",
  CLASS_ASSIGNED: "Sinfə təyinat", TEACHER_ASSIGNED: "Müəllim təyinatı", ABSENCE: "Qayıb", LESSON_COMPLETED: "Dərs tamamlandı", LESSON_CANCELLED: "Dərs ləğv", LESSON_SCHEDULED: "Dərs planlandı", GENERAL: "Ümumi",
};

const hrefFor = (type: string | null, id: string | null) =>
  type === "payment" && id ? `/admin/payments?status=ALL` : type === "application" ? `/admin/leads` : type === "scholarship" ? `/admin/scholarship` : type === "class" && id ? `/admin/classes/${id}` : type === "student" && id ? `/admin/students/${id}` : null;

export default async function AdminNotificationsPage({ searchParams }: { searchParams: { page?: string; event?: string; read?: string } }) {
  await adminGuard();
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const where = { userId, ...(searchParams.event && searchParams.event in EVENT_LABEL ? { event: searchParams.event } : {}), ...(searchParams.read === "false" ? { read: false } : searchParams.read === "true" ? { read: true } : {}) };
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return (
    <div>
      <AdminTopbar title="Bildirişlər" subtitle={`${unread} oxunmamış`} />
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
            <select name="event" defaultValue={searchParams.event ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Növ"><option value="">Bütün növlər</option>{Object.entries(EVENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select name="read" defaultValue={searchParams.read ?? ""} className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm" aria-label="Oxunma"><option value="">Hamısı</option><option value="false">Oxunmamış</option><option value="true">Oxunmuş</option></select>
            <button type="submit" className="rounded-full border border-navy-100 px-4 py-2 text-xs font-bold hover:bg-navy-50">Filtr</button>
          </form>
          <MarkAllReadButton disabled={unread === 0} />
        </div>
        <div className={card}>
          <ul>
            {items.length === 0 && <li className="px-6 py-12 text-center text-navy-400">Bildiriş yoxdur.</li>}
            {items.map((n) => {
              const href = hrefFor(n.entityType, n.entityId);
              return (
                <li key={n.id} className={`flex items-start justify-between gap-4 border-b border-navy-50 px-6 py-4 last:border-0 ${n.read ? "" : "bg-amber-50/50"}`}>
                  <div>
                    <p className="text-sm font-bold text-navy-900">{n.title}{n.event && EVENT_LABEL[n.event] && <span className="ml-2 rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-bold uppercase text-navy-400">{EVENT_LABEL[n.event]}</span>}{!n.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-label="oxunmamış" />}</p>
                    <p className="mt-0.5 text-sm text-navy-600">{n.body}</p>
                    <p className="mt-1 text-xs text-navy-400">{fmtDate(n.createdAt)}</p>
                  </div>
                  {href && <Link href={href} className="shrink-0 text-xs font-bold text-electric-600 hover:underline">Ətraflı bax</Link>}
                </li>
              );
            })}
          </ul>
          <Pagination base="/admin/notifications" params={{ event: searchParams.event, read: searchParams.read }} page={page} total={total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
