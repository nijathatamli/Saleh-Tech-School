"use server";

// Server actions behind the student dashboard. The submission a student hands
// in must be their own (src/lib/access.ts resolves it against the signed-in
// student); the status change, its audit entry and the teacher's notification
// commit in one transaction.
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessError, accessResult, requireStudent, requireStudentOwnsSubmission } from "@/lib/access";
import { audit, notifyUsers } from "@/lib/events";

type Fail = { ok: false; error: "unauthenticated" | "forbidden" | "not-found" | "invalid" | "failed" };
type Ok = { ok: true } | Fail;

async function actor() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") throw new AccessError("unauthenticated");
  return session.user.id;
}

function revalidate() {
  revalidatePath("/student", "layout");
  revalidatePath("/teacher", "layout");
  revalidatePath("/parent", "layout");
}

async function run(fn: (userId: string) => Promise<Ok>): Promise<Ok> {
  try {
    const userId = await actor();
    const result = await fn(userId);
    if (result.ok) revalidate();
    return result;
  } catch (err) {
    if (err instanceof AccessError) return accessResult(err);
    console.error("[student action]", err);
    return { ok: false, error: "failed" };
  }
}

/** Hands in the student's own homework: PENDING/OVERDUE → SUBMITTED, audited, teacher notified. */
export async function submitHomework(submissionId: string): Promise<Ok> {
  return run(async (userId) => {
    const { student, submission } = await requireStudentOwnsSubmission(userId, submissionId);
    if (submission.status !== "PENDING" && submission.status !== "OVERDUE") return { ok: false, error: "invalid" };
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.submission.update({ where: { id: submission.id }, data: { status: "SUBMITTED", submittedAt: now } });
      await audit(tx, { actorUserId: userId, action: "submission.submit", entityType: "submission", entityId: submission.id, before: { status: submission.status }, after: { status: "SUBMITTED", submittedAt: now.toISOString() } });
      const teacher = await tx.teacherProfile.findUnique({ where: { id: submission.homework.lesson.class.teacherId }, select: { userId: true } });
      const me = await tx.studentProfile.findUniqueOrThrow({ where: { id: student.id }, select: { firstName: true, lastName: true } });
      if (teacher) {
        await notifyUsers(tx, [teacher.userId], {
          title: "Yeni təhvil",
          body: `${me.firstName} ${me.lastName} "${submission.homework.title}" tapşırığını təhvil verdi.`,
          entityType: "submission",
          entityId: submission.id,
        });
      }
    });
    return { ok: true };
  });
}

export async function updateStudentAvatar(avatarUrl: string): Promise<Ok> {
  return run(async (userId) => {
    const student = await requireStudent(userId);
    await prisma.studentProfile.update({ where: { id: student.id }, data: { avatarUrl } });
    return { ok: true };
  });
}
