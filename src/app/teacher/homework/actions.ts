"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const homework = await prisma.homework.create({
    data: {
      lessonId: parsed.data.lessonId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: new Date(parsed.data.dueDate),
    },
  });

  // Create a PENDING submission placeholder for every student enrolled in that lesson's class.
  const lesson = await prisma.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    include: { class: { include: { enrollments: true } } },
  });
  if (lesson) {
    await prisma.submission.createMany({
      data: lesson.class.enrollments.map((e) => ({
        homeworkId: homework.id,
        studentId: e.studentId,
        status: "PENDING" as const,
      })),
    });
  }

  revalidatePath("/teacher/homework");
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

  await prisma.submission.update({
    where: { id: parsed.data.submissionId },
    data: { status: "GRADED", score: parsed.data.score, feedback: parsed.data.feedback || null },
  });

  revalidatePath("/teacher/homework");
}
