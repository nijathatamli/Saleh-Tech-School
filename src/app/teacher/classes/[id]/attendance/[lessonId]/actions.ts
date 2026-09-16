"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyParentsOfStudents } from "@/features/parent-dashboard/notify";
import { dayMonth, parts } from "@/features/parent-dashboard/az";

const STATUS_WORD = { ABSENT: "qayıb", LATE: "gecikmə", EXCUSED: "icazəli qayıb" } as const;

export async function markAttendance(
  lessonId: string,
  classId: string,
  studentId: string,
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
  note?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  // Only the class's own teacher can mark it.
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, class: { teacher: { userId: session.user.id } } },
    include: { class: { include: { course: true } } },
  });
  if (!lesson) return;

  const existing = await prisma.attendance.findFirst({ where: { lessonId, studentId } });
  const changed = !existing || existing.status !== status;

  if (existing) {
    await prisma.attendance.update({ where: { id: existing.id }, data: { status, note } });
  } else {
    await prisma.attendance.create({
      data: { lessonId, studentId, status, note, date: lesson.date },
    });
  }

  // Parents hear about anything other than a normal "present" mark.
  if (changed && status !== "PRESENT") {
    const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { firstName: true } });
    await notifyParentsOfStudents([studentId], {
      title: "Davamiyyət bildirişi",
      body: `${student?.firstName ?? "Tələbə"} ${dayMonth(parts(lesson.date))} tarixli "${lesson.title}" dərsində ${STATUS_WORD[status]} kimi qeyd edildi${note ? ` — ${note}` : ""}.`,
      type: status === "EXCUSED" ? "info" : "warning",
      category: "lessons",
    });
  }

  revalidatePath(`/teacher/classes/${classId}/attendance/${lessonId}`);
  revalidatePath("/parent", "layout");
}
