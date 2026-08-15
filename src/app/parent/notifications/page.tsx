import { Bell, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { markAllAsRead } from "./actions";

export const dynamic = "force-dynamic";

const typeMeta: Record<string, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "bg-electric-500/10 text-electric-600" },
  success: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600" },
  warning: { icon: AlertTriangle, className: "bg-amber-500/10 text-amber-600" },
  error: { icon: XCircle, className: "bg-red-500/10 text-red-600" },
};

function timeAgo(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} dəq əvvəl`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  return `${Math.floor(hours / 24)} gün əvvəl`;
}

export default async function NotificationsPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: parent.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <AppTopbar title="Bildirişlər" userName={parent.user.name} userEmail={parent.user.email} />

      <div className="space-y-6 p-6 md:p-10">
        {notifications.some((n) => !n.read) && (
          <form action={markAllAsRead}>
            <Button type="submit" variant="app-outline" size="sm">
              Hamısını oxunmuş et
            </Button>
          </form>
        )}

        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Hələ bildiriş yoxdur" description="Yeni bildirişlər burada görünəcək." />
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const meta = typeMeta[n.type] ?? typeMeta.info;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 rounded-2xl border p-5 shadow-sm shadow-navy-900/[0.03] ${
                    n.read ? "border-navy-100 bg-white" : "border-electric-200 bg-electric-50/40"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.className}`}>
                    <meta.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-navy-900">{n.title}</p>
                    <p className="mt-1 text-sm text-navy-400">{n.body}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-navy-400/70">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
