"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ token: z.string(), password: z.string().min(6, "Şifrə ən az 6 simvol olmalıdır") });

export type ResetState = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

export async function resetPassword(input: z.infer<typeof schema>): Promise<ResetState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" };
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { status: "error", message: "Link etibarsızdır və ya vaxtı bitib. Yenidən tələb edin." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { email: record.email }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { status: "success" };
}
