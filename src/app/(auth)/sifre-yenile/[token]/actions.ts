"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(16).max(200),
  password: z.string().min(8, "Şifrə ən az 8 simvol olmalıdır").max(72, "Şifrə çox uzundur"),
});

export type ResetState = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

const INVALID = { status: "error", message: "Link etibarsızdır və ya vaxtı bitib. Yenidən tələb edin." } as const;

/** Redeems a reset token: single use (claimed atomically), unexpired, for an account that is still active. */
export async function resetPassword(input: z.infer<typeof schema>): Promise<ResetState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" };

  const record = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return INVALID;

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const done = await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) return false; // somebody redeemed it first
    const changed = await tx.user.updateMany({ where: { email: record.email, active: true }, data: { passwordHash } });
    if (changed.count !== 1) throw new Error("inactive"); // rolls the claim back too
    await tx.passwordResetToken.updateMany({ where: { email: record.email, usedAt: null }, data: { usedAt: new Date() } }); // every other open link dies
    return true;
  }).catch(() => false);

  return done ? { status: "success" } : INVALID;
}
