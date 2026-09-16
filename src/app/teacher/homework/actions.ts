"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyParentsOfStudents } from "@/features/parent-dashboard/notify";
import { dayMonth, parts } from "@/features/parent-dashboard/az";

const createSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(3),
  dueDate: z.string().min(1),
});

export async function createHomework(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  const parsed = createSchema.safeParse({
    lessonId: formData.get("lessonId"),
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) return;

  // The lesson must belong to one of this teacher's classes.
  const lesson = await prisma.lesson.findFirst({
    where: { id: parsed.data.lessonId, class: { teacher: { userId: session.user.id } } },
    include: { class: { include: { enrollments: true, course: true } } },
  });
  if (!lesson) return;

  // Due at the end of that day, school time.
  const dueDate = new Date(`${parsed.data.dueDate}T23:59:00+04:00`);
  const homework = await prisma.homework.create({
    data: {
      lessonId: parsed.data.lessonId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate,
    },
  });

  // Create a PENDING submission placeholder for every student enrolled in that lesson's class.
  const studentIds = lesson.class.enrollments.map((e) => e.studentId);
  await prisma.submission.createMany({
    data: studentIds.map((studentId) => ({ homeworkId: homework.id, studentId, status: "PENDING" as const })),
  });

  await notifyParentsOfStudents(studentIds, {
    title: "Yeni ev tapşırığı",
    body: `${lesson.class.course.name}: "${homework.title}" — son tarix ${dayMonth(parts(dueDate))}.`,
    category: "grades",
  });

  revalidatePath("/teacher/homework");
  revalidatePath("/parent", "layout");
  redirect("/teacher/homework");
}

const gradeSchema = z.object({
  submissionId: z.string().min(1),
  score: z.coerce.number().int().min(0).max(100),
  feedback: z.string().optional(),
});

export async function gradeSubmission(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  const parsed = gradeSchema.safeParse({
    submissionId: formData.get("submissionId"),
    score: formData.get("score"),
    feedback: formData.get("feedback"),
  });
  if (!parsed.success) return;

  const submission = await prisma.submission.findFirst({
    where: { id: parsed.data.submissionId, homework: { lesson: { class: { teacher: { userId: session.user.id } } } } },
    include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
  });
  if (!submission) return;

  const feedback = parsed.data.feedback?.trim() || null;
  await prisma.submission.update({
    where: { id: submission.id },
    data: { status: "GRADED", score: parsed.data.score, feedback, submittedAt: submission.submittedAt ?? new Date() },
  });

  // The grade record is what the parent portal's progress trend is built from.
  await prisma.grade.upsert({
    where: { submissionId: submission.id },
    create: {
      studentId: submission.studentId,
      submissionId: submission.id,
      subject: submission.homework.lesson.class.course.name,
      score: parsed.data.score,
      maxScore: 100,
    },
    update: { score: parsed.data.score },
  });

  await notifyParentsOfStudents([submission.studentId], {
    title: "Ev tapşırığı qiymətləndirildi",
    body: `"${submission.homework.title}" — ${parsed.data.score} bal${feedback ? `. Müəllim qeydi: ${feedback}` : ""}`,
    type: "success",
    category: "grades",
  });

  revalidatePath("/teacher/homework");
  revalidatePath("/parent", "layout");
}
