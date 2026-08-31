import Link from "next/link";
import { School, Users, ClipboardList, CalendarCheck, ArrowUpRight } from "lucide-react";
import { getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashGreetingBanner } from "@/components/dash/greeting-banner";
import { DashStatCard } from "@/components/dash/stat-card";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { DashLedgerCard, DashLedgerRow, DashSectionLabel } from "@/components/dash/ledger";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

export default async function TeacherDashboardPage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const classIds = teacher.classes.map((c) => c.id);
  const studentCount = new Set(teacher.classes.flatMap((c) => c.enrollments.map((e) => e.studentId))).size;

  const pendingSubmissions = await prisma.submission.count({
    where: { status: "SUBMITTED", homework: { lesson: { classId: { in: classIds } } } },
  });

  const recentLessons = await prisma.lesson.findMany({
    where: { classId: { in: classIds } },
    include: { class: { include: { course: true } }, attendance: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  return (
    <div>
      <DashTopbar
        title="Dashboard"
        subtitle="Bugünkü xülasə"
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />

      <div className="space-y-8 p-6 md:p-10">
        <DashGreetingBanner greeting={`Salam, ${teacher.user.name.split(" ")[0]}`} subtitle="Bugünkü xülasəniz budur." />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DashStatCard label="Siniflərim" value={String(teacher.classes.length)} icon={School} color="electric" />
          <DashStatCard label="Tələbələr" value={String(studentCount)} icon={Users} color="violet" />
          <DashStatCard label="Qiymətləndirmə gözləyir" value={String(pendingSubmissions)} icon={ClipboardList} color="amber" />
          <DashStatCard label="Dərslər" value={String(recentLessons.length)} icon={CalendarCheck} color="teal" />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <DashSectionLabel>Siniflərim</DashSectionLabel>
            <Link href="/teacher/classes" className="flex items-center gap-1 text-xs font-bold text-electric-600">
              Hamısına bax <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {teacher.classes.length === 0 ? (
            <DashEmptyState icon={School} title="Hələ sinif təyin edilməyib" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {teacher.classes.map((c) => (
                <Link key={c.id} href={`/teacher/classes/${c.id}`}>
                  <DashCard interactive>
                    <p className="font-bold text-dash-ink dark:text-white">{c.name}</p>
                    <p className="mt-1 text-xs text-dash-ink/50 dark:text-white/40">{c.course.name}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-dash-ink/50 dark:text-white/40">{c.schedule}</span>
                      <span className="font-bold text-dash-ink dark:text-white">{c.enrollments.length} tələbə</span>
                    </div>
                  </DashCard>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <DashSectionLabel className="mb-4">Son fəaliyyət</DashSectionLabel>
          {recentLessons.length === 0 ? (
            <DashEmptyState icon={CalendarCheck} title="Hələ dərs qeydi yoxdur" />
          ) : (
            <DashLedgerCard>
              {recentLessons.map((l) => (
                <DashLedgerRow
                  key={l.id}
                  icon={CalendarCheck}
                  title={l.title}
                  meta={`${l.class.course.name} · ${formatDate(l.date)}`}
                  trailing={<span className="text-xs font-bold text-dash-ink/45 dark:text-white/40">{l.attendance.length} qeyd</span>}
                />
              ))}
            </DashLedgerCard>
          )}
        </div>
      </div>
    </div>
  );
}
