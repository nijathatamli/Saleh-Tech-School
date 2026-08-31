import Link from "next/link";
import { Users, CalendarCheck, GraduationCap, Star, ArrowUpRight } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashGreetingBanner } from "@/components/dash/greeting-banner";
import { DashStatCard } from "@/components/dash/stat-card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { ChildCard } from "@/components/app/child-card";
import { attendanceRate, averageGrade } from "@/lib/utils";
import { getServerDictionary, topbarLabels } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { locale, dict } = getServerDictionary();
  const unread = await prisma.notification.count({ where: { userId: parent.userId, read: false } });

  const overallAttendance = attendanceRate(parent.children.flatMap((c) => c.attendance));
  const overallGrade = averageGrade(parent.children.flatMap((c) => c.grades));
  const totalPoints = parent.children.reduce((sum, c) => sum + c.points, 0);

  return (
    <div>
      <DashTopbar
        title={dict.nav.dashboard}
        subtitle={dict.parentDashboard.subtitle}
        userName={parent.user.name}
        userEmail={parent.user.email}
        unreadNotifications={unread}
        notificationsHref="/parent/notifications"
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/parent/settings"
        showMobileMenuTrigger={false}
      />

      <div className="space-y-8 p-6 md:p-10">
        <DashGreetingBanner
          greeting={`${dict.parentDashboard.greetingPrefix}, ${parent.user.name.split(" ")[0]}`}
          subtitle={dict.parentDashboard.greetingSubtitle}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashStatCard label={dict.parentDashboard.statChildren} value={String(parent.children.length)} icon={Users} color="electric" />
          <DashStatCard label={dict.parentDashboard.statAvgAttendance} value={`${overallAttendance}%`} icon={CalendarCheck} color="teal" />
          <DashStatCard label={dict.parentDashboard.statAvgProgress} value={`${overallGrade}%`} icon={GraduationCap} color="violet" />
          <DashStatCard label={dict.parentDashboard.statTotalPoints} value={totalPoints.toLocaleString("az-AZ")} icon={Star} color="amber" />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base text-dash-ink dark:text-white">{dict.parentDashboard.myChildrenTitle}</h3>
            <Link href="/parent/children" className="flex items-center gap-1 text-xs font-bold text-electric-600">
              {dict.common.viewAll} <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {parent.children.length === 0 ? (
            <DashEmptyState
              icon={Users}
              title={dict.parentDashboard.noChildrenTitle}
              description={dict.parentDashboard.noChildrenDesc}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {parent.children.map((child) => (
                <ChildCard key={child.id} child={child} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
