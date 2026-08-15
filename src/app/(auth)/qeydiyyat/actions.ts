"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(3, "Ad Soyad ən az 3 hərf olmalıdır"),
  email: z.string().email("Düzgün email daxil edin"),
  phone: z.string().min(9, "Düzgün telefon nömrəsi daxil edin"),
  password: z.string().min(6, "Şifrə ən az 6 simvol olmalıdır"),
});

export type RegisterState = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

export async function registerParent(input: z.infer<typeof registerSchema>): Promise<RegisterState> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" };
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return { status: "error", message: "Bu email artıq qeydiyyatdan keçib." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: "PARENT",
      parentProfile: { create: {} },
    },
  });

  return { status: "success" };
}
