import { notFound } from "next/navigation";
import { getClassForTeacher, getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashLedgerCard } from "@/components/dash/ledger";
import { formatDate } from "@/lib/utils";
import { AttendanceRow } from "./attendance-row";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

export default async function MarkAttendancePage({ params }: { params: { id: string; lessonId: string } }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const classGroup = await getClassForTeacher(params.id);
  if (!classGroup) notFound();

  const lesson = classGroup.lessons.find((l) => l.id === params.lessonId);
  if (!lesson) notFound();

  const existingAttendance = await prisma.attendance.findMany({ where: { lessonId: lesson.id } });
  const attendanceByStudent = new Map(existingAttendance.map((a) => [a.studentId, a]));

  return (
    <div>
      <DashTopbar
        title="Davamiyyəti işarələ"
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />

      <div className="space-y-6 p-6 md:p-10">
        <DashCard>
          <p className="text-xs font-bold uppercase tracking-widest text-electric-600">{classGroup.name}</p>
          <h2 className="mt-1 font-display text-lg text-dash-ink dark:text-white">{lesson.title}</h2>
          <p className="mt-1 text-sm text-dash-ink/50 dark:text-white/40">{formatDate(lesson.date)}</p>
        </DashCard>

        <DashLedgerCard>
          {classGroup.enrollments.map((e) => {
            const existing = attendanceByStudent.get(e.student.id);
            return (
              <AttendanceRow
                key={e.id}
                lessonId={lesson.id}
                classId={classGroup.id}
                studentId={e.student.id}
                name={`${e.student.firstName} ${e.student.lastName}`}
                avatarUrl={e.student.avatarUrl}
                initialStatus={existing?.status ?? null}
                initialNote={existing?.note ?? null}
              />
            );
          })}
        </DashLedgerCard>
      </div>
    </div>
  );
}
