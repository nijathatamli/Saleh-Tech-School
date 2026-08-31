import { redirect } from "next/navigation";
import { DashHeader } from "@/components/dash/header";
import { DashRail } from "@/components/dash/rail";
import { PageTransition } from "@/components/app/page-transition";
import { getCurrentParent } from "@/lib/data";
import { getParentNavItems } from "@/lib/nav";
import { getServerDictionary, topbarLabels } from "@/i18n/server";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const parent = await getCurrentParent();
  if (!parent) redirect("/giris");

  const { locale, dict } = getServerDictionary();

  return (
    <div className="flex min-h-screen flex-col bg-dash-paper font-app text-dash-ink dark:bg-dash-dark-bg dark:text-white">
      <DashHeader
        brandHref="/parent"
        userName={parent.user.name}
        userEmail={parent.user.email}
        avatarUrl={parent.user.avatarUrl}
        settingsHref="/parent/settings"
        notificationsHref="/parent/notifications"
        locale={locale}
        labels={topbarLabels(dict)}
      />
      <div className="flex flex-1">
        <DashRail items={getParentNavItems(dict)} brandHref="/parent" />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
