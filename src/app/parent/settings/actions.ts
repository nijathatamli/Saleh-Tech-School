"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ name: z.string().min(3), phone: z.string().min(9) });

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return;

  const parsed = schema.safeParse({ name: formData.get("name"), phone: formData.get("phone") });
  if (!parsed.success) return;

  await prisma.user.update({ where: { id: session.user.id }, data: parsed.data });
  revalidatePath("/parent/settings");
}
