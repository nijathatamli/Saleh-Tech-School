import { notFound } from "next/navigation";
import { FolderGit2 } from "lucide-react";
import { getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { DashSectionLabel } from "@/components/dash/ledger";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { attendanceRate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

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
      attendance: true,
      projects: true,
      grades: true,
    },
  });
  if (!student) notFound();

  const rate = attendanceRate(student.attendance);

  return (
    <div>
      <DashTopbar
        title={`${student.firstName} ${student.lastName}`}
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />

      <div className="space-y-8 p-6 md:p-10">
        <DashCard className="flex flex-col items-center gap-6 p-8 sm:flex-row">
          <Avatar name={`${student.firstName} ${student.lastName}`} src={student.avatarUrl} size={72} />
          <div className="text-center sm:text-left">
            <h2 className="font-display text-xl text-dash-ink dark:text-white">
              {student.firstName} {student.lastName}
            </h2>
            <p className="mt-1 text-sm text-dash-ink/50 dark:text-white/40">
              Səviyyə {student.level} · Valideyn: {student.parent.user.name}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {student.enrollments.map((e) => (
                <Badge key={e.id} variant="app-electric">{e.course.name}</Badge>
              ))}
            </div>
          </div>
          <div className="ml-0 grid grid-cols-2 gap-6 sm:ml-auto">
            <div className="text-center">
              <p className="font-display text-xl text-dash-ink dark:text-white">{rate}%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-dash-ink/40 dark:text-white/35">Davamiyyət</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-dash-ink dark:text-white">{student.grades.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-dash-ink/40 dark:text-white/35">Qiymət</p>
            </div>
          </div>
        </DashCard>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <DashCard>
              <DashSectionLabel className="mb-6">Qiymətlər</DashSectionLabel>
              {student.grades.length === 0 ? (
                <p className="text-sm text-dash-ink/50 dark:text-white/40">Hələ qiymət qeydi yoxdur.</p>
              ) : (
                <div className="space-y-3">
                  {student.grades.map((g) => (
                    <div key={g.id} className="flex items-center justify-between text-sm">
                      <span className="text-dash-ink/60 dark:text-white/50">{g.subject}</span>
                      <span className="font-bold text-dash-ink dark:text-white">{g.score}/{g.maxScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </DashCard>

            <DashCard>
              <DashSectionLabel className="mb-6">
                <FolderGit2 className="h-3.5 w-3.5" /> Layihələr
              </DashSectionLabel>
              {student.projects.length === 0 ? (
                <DashEmptyState icon={FolderGit2} title="Hələ layihə yoxdur" />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {student.projects.map((p) => (
                    <div key={p.id} className="rounded-xl border border-dash-rule p-4 dark:border-dash-dark-rule">
                      <p className="text-sm font-bold text-dash-ink dark:text-white">{p.title}</p>
                      <p className="mt-1 text-xs text-dash-ink/50 dark:text-white/40">{p.technologies.join(", ")}</p>
                    </div>
                  ))}
                </div>
              )}
            </DashCard>
          </div>
        </div>
      </div>
    </div>
  );
}
