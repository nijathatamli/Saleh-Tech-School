"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyParentsOfStudents } from "@/features/parent-dashboard/notify";

async function teacherOwnsStudent(userId: string, studentId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, class: { teacher: { userId } } },
    select: { id: true },
  });
  return !!enrollment;
}

const skillSchema = z.object({
  studentId: z.string().min(1),
  skill: z.string().trim().min(2).max(60),
  percent: z.coerce.number().int().min(0).max(100),
});

/** Sets a skill's progress for a student — the bars under "Öyrənmə inkişafı" in the parent portal. */
export async function updateSkillProgress(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  const parsed = skillSchema.safeParse({
    studentId: formData.get("studentId"),
    skill: formData.get("skill"),
    percent: formData.get("percent"),
  });
  if (!parsed.success) return;
  if (!(await teacherOwnsStudent(session.user.id, parsed.data.studentId))) return;

  const existing = await prisma.skillProgress.findFirst({
    where: { studentId: parsed.data.studentId, skill: { equals: parsed.data.skill, mode: "insensitive" } },
  });
  if (existing) {
    await prisma.skillProgress.update({ where: { id: existing.id }, data: { percent: parsed.data.percent } });
  } else {
    await prisma.skillProgress.create({
      data: { studentId: parsed.data.studentId, skill: parsed.data.skill, percent: parsed.data.percent },
    });
  }

  revalidatePath(`/teacher/students/${parsed.data.studentId}`);
  revalidatePath("/parent", "layout");
}

const badgeSchema = z.object({ studentId: z.string().min(1), badgeId: z.string().min(1) });

/** Awards a badge — shown under "Nailiyyətlər" and announced to the parent. */
export async function awardBadge(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  const parsed = badgeSchema.safeParse({ studentId: formData.get("studentId"), badgeId: formData.get("badgeId") });
  if (!parsed.success) return;
  if (!(await teacherOwnsStudent(session.user.id, parsed.data.studentId))) return;

  const badge = await prisma.badge.findUnique({ where: { id: parsed.data.badgeId } });
  if (!badge) return;
  const already = await prisma.studentBadge.findFirst({ where: { studentId: parsed.data.studentId, badgeId: badge.id } });
  if (already) return;

  await prisma.studentBadge.create({ data: { studentId: parsed.data.studentId, badgeId: badge.id } });
  await notifyParentsOfStudents([parsed.data.studentId], {
    title: "Nailiyyət açıldı",
    body: `${badge.emoji} ${badge.name} — ${badge.description}`,
    type: "success",
    category: "grades",
  });

  revalidatePath(`/teacher/students/${parsed.data.studentId}`);
  revalidatePath("/parent", "layout");
}
