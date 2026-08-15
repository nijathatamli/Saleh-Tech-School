import { notFound } from "next/navigation";
import { getClassForTeacher, getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { formatDate } from "@/lib/utils";
import { AttendanceRow } from "./attendance-row";

export const dynamic = "force-dynamic";

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
      <AppTopbar title="Davamiyyəti işarələ" userName={teacher.user.name} userEmail={teacher.user.email} />

      <div className="space-y-6 p-6 md:p-10">
        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <p className="text-xs font-bold uppercase tracking-widest text-electric-600">{classGroup.name}</p>
          <h2 className="mt-1 font-display text-lg text-navy-900">{lesson.title}</h2>
          <p className="mt-1 text-sm text-navy-400">{formatDate(lesson.date)}</p>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
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
        </div>
      </div>
    </div>
  );
}
