import { notFound } from "next/navigation";
import { Trophy, FolderGit2 } from "lucide-react";
import { getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { attendanceRate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherStudentProfilePage({ params }: { params: { id: string } }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const classIds = teacher.classes.map((c) => c.id);
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: params.id, classId: { in: classIds } },
  });
  if (!enrollment) notFound();

  const student = await prisma.studentProfile.findUnique({
    where: { id: params.id },
    include: {
      parent: { include: { user: true } },
      enrollments: { include: { course: true } },
      progress: true,
      attendance: true,
      studentBadges: { include: { badge: true } },
      projects: true,
      grades: true,
    },
  });
  if (!student) notFound();

  const rate = attendanceRate(student.attendance);

  return (
    <div>
      <AppTopbar title={`${student.firstName} ${student.lastName}`} userName={teacher.user.name} userEmail={teacher.user.email} />

      <div className="space-y-8 p-6 md:p-10">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-navy-100 bg-white p-8 shadow-sm shadow-navy-900/[0.03] sm:flex-row">
          <Avatar name={`${student.firstName} ${student.lastName}`} src={student.avatarUrl} size={72} />
          <div className="text-center sm:text-left">
            <h2 className="font-app text-xl font-extrabold text-navy-900">
              {student.firstName} {student.lastName}
            </h2>
            <p className="mt-1 text-sm text-navy-400">
              Səviyyə {student.level} · Valideyn: {student.parent.user.name}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {student.enrollments.map((e) => (
                <Badge key={e.id} variant="app-electric">{e.course.name}</Badge>
              ))}
            </div>
          </div>
          <div className="ml-0 grid grid-cols-3 gap-6 sm:ml-auto">
            <div className="text-center">
              <p className="font-app text-xl font-extrabold text-navy-900">{student.points.toLocaleString("az-AZ")}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">Xal</p>
            </div>
            <div className="text-center">
              <p className="font-app text-xl font-extrabold text-navy-900">{rate}%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">Davamiyyət</p>
            </div>
            <div className="text-center">
              <p className="font-app text-xl font-extrabold text-navy-900">{student.grades.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">Qiymət</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-6 font-app text-base font-bold text-navy-900">Bacarıqlar üzrə tərəqqi</h3>
              {student.progress.length === 0 ? (
                <p className="text-sm text-navy-400">Hələ tərəqqi qeydi yoxdur.</p>
              ) : (
                <div className="space-y-5">
                  {student.progress.map((p) => (
                    <div key={p.id}>
                      <div className="mb-1.5 flex justify-between text-xs text-navy-400">
                        <span>{p.skill}</span>
                        <span className="font-bold text-navy-900">{p.percent}%</span>
                      </div>
                      <Progress value={p.percent} color="electric" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-6 font-app text-base font-bold text-navy-900">Qiymətlər</h3>
              {student.grades.length === 0 ? (
                <p className="text-sm text-navy-400">Hələ qiymət qeydi yoxdur.</p>
              ) : (
                <div className="space-y-3">
                  {student.grades.map((g) => (
                    <div key={g.id} className="flex items-center justify-between text-sm">
                      <span className="text-navy-600">{g.subject}</span>
                      <span className="font-bold text-navy-900">{g.score}/{g.maxScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-6 flex items-center gap-2 font-app text-base font-bold text-navy-900">
                <FolderGit2 className="h-4 w-4 text-electric-500" /> Layihələr
              </h3>
              {student.projects.length === 0 ? (
                <EmptyState icon={FolderGit2} title="Hələ layihə yoxdur" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {student.projects.map((p) => (
                    <div key={p.id} className="rounded-xl border border-navy-100 p-4">
                      <p className="text-sm font-bold text-navy-900">{p.title}</p>
                      <p className="mt-1 text-xs text-navy-400">{p.technologies.join(", ")}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-6 flex items-center gap-2 font-app text-base font-bold text-navy-900">
                <Trophy className="h-4 w-4 text-amber-500" /> Nailiyyətlər
              </h3>
              {student.studentBadges.length === 0 ? (
                <p className="text-sm text-navy-400">Hələ nişan qazanılmayıb.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {student.studentBadges.map((sb) => (
                    <div key={sb.id} className="flex flex-col items-center gap-1 rounded-xl bg-navy-50 p-3 text-center">
                      <span className="text-2xl">{sb.badge.emoji}</span>
                      <span className="text-[10px] font-bold leading-tight text-navy-900">{sb.badge.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
