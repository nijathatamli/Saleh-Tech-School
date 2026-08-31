"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateStudentAvatar(avatarUrl: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") return;

  await prisma.studentProfile.update({
    where: { userId: session.user.id },
    data: { avatarUrl },
  });

  revalidatePath("/student/settings");
  revalidatePath("/student", "layout");
}
