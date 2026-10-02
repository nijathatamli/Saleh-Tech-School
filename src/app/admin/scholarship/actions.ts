"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCourseCode, generateCourseCode } from "@/lib/scholarship/security";

export type GenerateState = { status: "idle" } | { status: "error"; message: string } | { status: "ok"; codes: string[] };

/** Admin only: mints single-use 32-character course codes to hand to course students. */
export async function generateScholarshipCodes(_prev: GenerateState, formData: FormData): Promise<GenerateState> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return { status: "error", message: "Bu əməliyyata icazə verilmir." };

  const count = Number(formData.get("count"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 80) || null;
  if (!Number.isInteger(count) || count < 1 || count > 200) return { status: "error", message: "Say 1 ilə 200 arasında olmalıdır." };

  const codes = Array.from({ length: count }, () => generateCourseCode());
  await prisma.scholarshipCode.createMany({ data: codes.map((code) => ({ code, note })) });
  revalidatePath("/admin/scholarship");
  return { status: "ok", codes: codes.map(formatCourseCode) };
}
