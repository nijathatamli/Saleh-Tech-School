"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/events";
import { ipFromHeader, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email() });

export type ForgotState = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

/**
 * There is no e-mail service, so no reset link is ever created or shown: handing a working link back to
 * whoever typed an address would let anyone take over any account (administrators included). Instead the
 * school's admins are told who asked and set a new password from the admin panel after contacting the person.
 * The answer is identical whether or not the account exists (no account enumeration) and requests are throttled.
 */
export async function requestPasswordReset(input: z.infer<typeof schema>): Promise<ForgotState> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Düzgün email daxil edin" };
  const email = parsed.data.email.toLowerCase();

  const ip = ipFromHeader((n) => headers().get(n));
  if (!rateLimit(`reset:ip:${ip}`, 10, 15 * 60_000).ok || !rateLimit(`reset:email:${email}`, 3, 60 * 60_000).ok) return { status: "success" };

  const user = await prisma.user.findUnique({ where: { email }, select: { name: true, email: true, role: true, active: true } });
  if (user?.active) {
    await notifyAdmins(prisma, {
      title: "Şifrə bərpası sorğusu",
      body: `${user.name} (${user.email}, ${user.role}) şifrəsini unutduğunu bildirdi. İstifadəçi ilə əlaqə saxlayın və admin paneldən yeni şifrə təyin edin.`,
      type: "warning",
      event: "GENERAL",
    });
  }
  return { status: "success" };
}
