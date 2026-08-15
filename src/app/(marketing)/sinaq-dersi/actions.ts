"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const trialSchema = z.object({
  parentName: z.string().min(3, "Ad Soyad ən az 3 hərf olmalıdır"),
  parentPhone: z.string().min(9, "Düzgün telefon nömrəsi daxil edin"),
  studentName: z.string().min(2, "Uşağın adını daxil edin"),
  studentAge: z.number().int().min(6).max(18),
  courseId: z.string().optional(),
  preferredDate: z.string(),
  preferredTime: z.string(),
});

export type TrialFormState =
  | { status: "idle" }
  | { status: "success"; bookingId: string }
  | { status: "error"; message: string };

export async function createTrialBooking(input: z.infer<typeof trialSchema>): Promise<TrialFormState> {
  const parsed = trialSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" };
  }

  const { parentName, parentPhone, studentName, studentAge, courseId, preferredDate, preferredTime } = parsed.data;

  const booking = await prisma.trialBooking.create({
    data: {
      parentName,
      parentPhone,
      studentName,
      studentAge,
      courseId: courseId || undefined,
      preferredDate: new Date(preferredDate),
      preferredTime,
    },
  });

  return { status: "success", bookingId: booking.id };
}
