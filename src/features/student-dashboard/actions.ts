"use server";

// Server actions behind the student dashboard's controls: handing in homework
// and changing the avatar (the actions the previous student pages used, moved
// here unchanged apart from revalidating the single dashboard route).
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DASHBOARD = "/student";

async function studentSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") return null;
  return session;
}

export async function submitHomework(submissionId: string) {
  const session = await studentSession();
  if (!session) return { ok: false as const };

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId },
    include: { student: true },
  });
  if (!submission || submission.student.userId !== session.user.id) return { ok: false as const };
  if (submission.status !== "PENDING" && submission.status !== "OVERDUE") return { ok: false as const };

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  revalidatePath(DASHBOARD, "layout");
  revalidatePath("/teacher", "layout");
  return { ok: true as const };
}

export async function updateStudentAvatar(avatarUrl: string) {
  const session = await studentSession();
  if (!session) return;

  await prisma.studentProfile.update({
    where: { userId: session.user.id },
    data: { avatarUrl },
  });

  revalidatePath(DASHBOARD, "layout");
}
