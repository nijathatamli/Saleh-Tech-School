import Link from "next/link";
import { School, Users, ClipboardList, CalendarCheck, ArrowUpRight } from "lucide-react";
import { getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
      <AppTopbar title="Dashboard" userName={teacher.user.name} userEmail={teacher.user.email} />

      <div className="space-y-8 p-6 md:p-10">
        <div>
          <h2 className="font-app text-2xl font-extrabold text-navy-900">Salam, {teacher.user.name.split(" ")[0]} 👋</h2>
          <p className="mt-1 text-sm text-navy-400">Bugünkü xülasəniz budur.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Siniflərim" value={String(teacher.classes.length)} icon={School} color="electric" />
          <StatCard label="Tələbələr" value={String(studentCount)} icon={Users} color="violet" />
          <StatCard label="Qiymətləndirmə gözləyir" value={String(pendingSubmissions)} icon={ClipboardList} color="amber" />
          <StatCard label="Dərslər" value={String(recentLessons.length)} icon={CalendarCheck} color="emerald" />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-app text-base font-bold text-navy-900">Siniflərim</h3>
            <Link href="/teacher/classes" className="flex items-center gap-1 text-xs font-bold text-electric-600">
              Hamısına bax <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {teacher.classes.length === 0 ? (
            <EmptyState icon={School} title="Hələ sinif təyin edilməyib" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {teacher.classes.map((c) => (
                <Link
                  key={c.id}
                  href={`/teacher/classes/${c.id}`}
                  className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="font-bold text-navy-900">{c.name}</p>
                  <p className="mt-1 text-xs text-navy-400">{c.course.name}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-navy-400">
                    <span>{c.schedule}</span>
                    <span className="font-bold text-navy-900">{c.enrollments.length} tələbə</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-4 font-app text-base font-bold text-navy-900">Son fəaliyyət</h3>
          <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
            {recentLessons.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={CalendarCheck} title="Hələ dərs qeydi yoxdur" />
              </div>
            ) : (
              <div className="divide-y divide-navy-100">
                {recentLessons.map((l) => (
                  <div key={l.id} className="flex items-center gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy-900">{l.title}</p>
                      <p className="text-xs text-navy-400">{l.class.course.name} · {formatDate(l.date)}</p>
                    </div>
                    <span className="text-xs font-bold text-navy-400">{l.attendance.length} qeyd</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
