"use server";

import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export type ForgotState = { status: "idle" } | { status: "success"; resetLink: string } | { status: "error"; message: string };

export async function requestPasswordReset(input: z.infer<typeof schema>): Promise<ForgotState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Düzgün email daxil edin" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  // Always respond the same way whether the account exists or not, to avoid leaking which emails are registered.
  if (!user) {
    return { status: "success", resetLink: "" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { email: user.email, token, expiresAt: new Date(Date.now() + 1000 * 60 * 30) },
  });

  return { status: "success", resetLink: `/sifre-yenile/${token}` };
}
