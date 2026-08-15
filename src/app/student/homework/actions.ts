"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function submitHomework(submissionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") return;

  const submission = await prisma.submission.findFirst({
    where: { id: submissionId },
    include: { student: true },
  });
  if (!submission || submission.student.userId !== session.user.id) return;

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "SUBMITTED", submittedAt: new Date() },
  });

  revalidatePath("/student/homework");
  revalidatePath("/student");
}
