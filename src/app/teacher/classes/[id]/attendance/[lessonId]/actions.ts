"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function markAttendance(
  lessonId: string,
  classId: string,
  studentId: string,
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
  note?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) return;

  const existing = await prisma.attendance.findFirst({ where: { lessonId, studentId } });

  if (existing) {
    await prisma.attendance.update({ where: { id: existing.id }, data: { status, note } });
  } else {
    await prisma.attendance.create({
      data: { lessonId, studentId, status, note, date: lesson.date },
    });
  }

  revalidatePath(`/teacher/classes/${classId}/attendance/${lessonId}`);
}
