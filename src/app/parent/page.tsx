import Link from "next/link";
import { Users, CalendarCheck, TrendingUp, Star, ArrowUpRight } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChildCard } from "@/components/app/child-card";
import { attendanceRate, averageProgress } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const unread = await prisma.notification.count({ where: { userId: parent.userId, read: false } });

  const overallAttendance = attendanceRate(parent.children.flatMap((c) => c.attendance));
  const overallProgress = averageProgress(parent.children.flatMap((c) => c.progress));
  const totalPoints = parent.children.reduce((sum, c) => sum + c.points, 0);

  return (
    <div>
      <AppTopbar title="Dashboard" userName={parent.user.name} userEmail={parent.user.email} unreadNotifications={unread} />

      <div className="space-y-8 p-6 md:p-10">
        <div>
          <h2 className="font-display text-2xl text-navy-900">Salam, {parent.user.name.split(" ")[0]} 👋</h2>
          <p className="mt-1 text-sm text-navy-400">Övladlarınızın bugünkü xülasəsi budur.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Uşaqlar" value={String(parent.children.length)} icon={Users} color="electric" />
          <StatCard label="Ortalama Davamiyyət" value={`${overallAttendance}%`} icon={CalendarCheck} color="emerald" />
          <StatCard label="Ortalama Tərəqqi" value={`${overallProgress}%`} icon={TrendingUp} color="violet" />
          <StatCard label="Ümumi Xal" value={totalPoints.toLocaleString("az-AZ")} icon={Star} color="amber" />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base text-navy-900">Uşaqlarım</h3>
            <Link href="/parent/children" className="flex items-center gap-1 text-xs font-bold text-electric-600">
              Hamısına bax <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {parent.children.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Hələ heç bir uşaq əlavə edilməyib"
              description="Övladınızı əlavə etmək üçün dəstək komandası ilə əlaqə saxlayın."
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
