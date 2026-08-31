import { Bell, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashEmptyState } from "@/components/dash/empty-state";
import { Button } from "@/components/ui/button";
import { getServerDictionary, topbarLabels } from "@/i18n/server";
import { format } from "@/i18n/locales";
import { markAllAsRead, markOneAsRead } from "./actions";

export const dynamic = "force-dynamic";

const typeMeta: Record<string, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "bg-electric-500/10 text-electric-600" },
  success: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600" },
  warning: { icon: AlertTriangle, className: "bg-amber-500/10 text-amber-600" },
  error: { icon: XCircle, className: "bg-red-500/10 text-red-600" },
};

function timeAgo(date: Date, dict: ReturnType<typeof getServerDictionary>["dict"]) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return format(dict.notifications.minutesAgo, { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return format(dict.notifications.hoursAgo, { n: hours });
  return format(dict.notifications.daysAgo, { n: Math.floor(hours / 24) });
}

export default async function NotificationsPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { locale, dict } = getServerDictionary();

  const notifications = await prisma.notification.findMany({
    where: { userId: parent.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <DashTopbar
        title={dict.notifications.title}
        userName={parent.user.name}
        userEmail={parent.user.email}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/parent/settings"
        showMobileMenuTrigger={false}
      />

      <div className="space-y-6 p-6 md:p-10">
        {notifications.some((n) => !n.read) && (
          <form action={markAllAsRead}>
            <Button type="submit" variant="app-outline" size="sm">
              {dict.notifications.markAllRead}
            </Button>
          </form>
        )}

        {notifications.length === 0 ? (
          <DashEmptyState icon={Bell} title={dict.notifications.noneTitle} description={dict.notifications.noneDesc} />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const meta = typeMeta[n.type] ?? typeMeta.info;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 rounded-lg border p-5 dark:border-dash-dark-rule ${
                    n.read
                      ? "border-dash-rule bg-white dark:bg-dash-dark-surface"
                      : "border-electric-200 bg-electric-50/40 dark:bg-electric-500/[0.06]"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.className}`}>
                    <meta.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-dash-ink dark:text-white">{n.title}</p>
                    <p className="mt-1 text-sm text-dash-ink/50 dark:text-white/45">{n.body}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-dash-ink/35 dark:text-white/30">
                      {timeAgo(n.createdAt, dict)}
                    </p>
                  </div>
                  {!n.read && (
                    <form action={markOneAsRead.bind(null, n.id)}>
                      <button
                        type="submit"
                        className="whitespace-nowrap text-xs font-bold text-electric-600 hover:underline"
                      >
                        {dict.notifications.markOneRead}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
