import { redirect } from "next/navigation";
import { DashRail } from "@/components/dash/rail";
import { ParentSidebar } from "@/components/dash/parent-sidebar";
import { ParentTopBar } from "@/components/dash/parent-topbar";
import { PageTransition } from "@/components/app/page-transition";
import { getCurrentParent, getUnreadNotificationCount } from "@/lib/data";
import { getParentNavItems } from "@/lib/nav";
import { getServerDictionary, topbarLabels } from "@/i18n/server";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const parent = await getCurrentParent();
  if (!parent) redirect("/giris");

  const { locale, dict } = getServerDictionary();
  const unreadNotifications = await getUnreadNotificationCount(parent.userId);
  const child = parent.children[0];
  const pendingHomework = child ? child.submissions.filter((s) => s.status === "PENDING" || s.status === "OVERDUE").length : 0;

  const navItems = getParentNavItems(dict);
  const badges: Record<string, number> = {};
  if (pendingHomework > 0) badges["/parent/homework"] = pendingHomework;
  if (unreadNotifications > 0) badges["/parent/notifications"] = unreadNotifications;

  return (
    <div className="flex min-h-screen flex-col bg-dash-paper font-app text-dash-ink dark:bg-dash-dark-bg dark:text-white">
      <ParentTopBar
        userName={parent.user.name}
        userEmail={parent.user.email}
        avatarUrl={parent.user.avatarUrl}
        settingsHref="/parent/settings"
        notificationsHref="/parent/notifications"
        notificationsLabel={dict.nav.notifications}
        dateLabel={new Date().toLocaleDateString("az-AZ", { day: "numeric", month: "long", weekday: "long" })}
        locale={locale}
        labels={topbarLabels(dict)}
      />
      <div className="flex flex-1">
        <ParentSidebar
          items={navItems}
          brandHref="/parent"
          badges={badges}
          user={{ name: parent.user.name, avatarUrl: parent.user.avatarUrl }}
          roleLabel={dict.sidebar.roleParent}
        />
        <DashRail items={navItems} brandHref="/parent" hideDesktopRail />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
