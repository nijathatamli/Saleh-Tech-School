"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyParentsOfStudents } from "@/features/parent-dashboard/notify";
import { clock, dayMonth, fromBakuLocal, parts } from "@/features/parent-dashboard/az";

const lessonSchema = z.object({
  classId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
  link: z.string().url().optional().or(z.literal("")),
});

/** Schedules a lesson for one of the teacher's classes; parents see it as "Növbəti dərs". */
export async function createLesson(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  const parsed = lessonSchema.safeParse({
    classId: formData.get("classId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    date: formData.get("date"),
    link: formData.get("link") ?? "",
  });
  if (!parsed.success) return;

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classId, teacher: { userId: session.user.id } },
    include: { course: true, enrollments: true },
  });
  if (!classGroup) return;

  const date = fromBakuLocal(parsed.data.date);
  const lesson = await prisma.lesson.create({
    data: {
      classId: classGroup.id,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || "",
      date,
      materialsUrl: parsed.data.link || null,
    },
  });

  await notifyParentsOfStudents(
    classGroup.enrollments.map((e) => e.studentId),
    {
      title: "Yeni dərs planlaşdırıldı",
      body: `${classGroup.course.name}: "${lesson.title}" — ${dayMonth(parts(date))}, ${clock(parts(date))}.`,
      category: "lessons",
    }
  );

  revalidatePath(`/teacher/classes/${classGroup.id}`);
  revalidatePath("/parent", "layout");
}
