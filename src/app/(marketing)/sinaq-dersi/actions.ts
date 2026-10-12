"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/events";
import { ipFromHeader, rateLimit } from "@/lib/rate-limit";

// Public, unauthenticated endpoint: every field is bounded, the date must be a real near-future date and the
// number of requests per visitor/phone is limited, because each accepted request notifies every admin.
const DAY = 86_400_000;
const trialSchema = z.object({
  parentName: z.string().trim().min(3, "Ad Soyad ən az 3 hərf olmalıdır").max(80, "Ad Soyad çox uzundur"),
  parentPhone: z.string().trim().min(9, "Düzgün telefon nömrəsi daxil edin").max(20, "Düzgün telefon nömrəsi daxil edin").regex(/^[0-9+()\-\s]+$/, "Düzgün telefon nömrəsi daxil edin"),
  studentName: z.string().trim().min(2, "Uşağın adını daxil edin").max(80, "Uşağın adı çox uzundur"),
  studentAge: z.number().int().min(6).max(18),
  courseId: z.string().max(80).optional(),
  preferredDate: z.string().max(40).refine((v) => {
    const t = Date.parse(v);
    return !Number.isNaN(t) && t > Date.now() - 2 * DAY && t < Date.now() + 400 * DAY;
  }, "Tarix düzgün deyil"),
  preferredTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vaxt düzgün deyil"),
});

export type TrialFormState =
  | { status: "idle" }
  | { status: "success"; bookingId: string }
  | { status: "error"; message: string };

const TOO_MANY: TrialFormState = { status: "error", message: "Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin." };

export async function createTrialBooking(input: z.infer<typeof trialSchema>): Promise<TrialFormState> {
  const parsed = trialSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" };
  }
  const { parentName, parentPhone, studentName, studentAge, courseId, preferredDate, preferredTime } = parsed.data;

  const ip = ipFromHeader((n) => headers().get(n));
  const phoneKey = parentPhone.replace(/\D/g, "");
  if (!rateLimit(`trial:ip:${ip}`, 5, 30 * 60_000).ok || !rateLimit(`trial:phone:${phoneKey}`, 3, DAY).ok) return TOO_MANY;

  try {
    // the public site sends the course slug (landing content is a snapshot); accept a real id too
    const course = courseId ? await prisma.course.findFirst({ where: { OR: [{ id: courseId }, { slug: courseId }] }, select: { id: true } }) : null;

    const booking = await prisma.trialBooking.create({
      data: { parentName, parentPhone, studentName, studentAge, courseId: course?.id, preferredDate: new Date(preferredDate), preferredTime },
    });

    // tell the admins right away (best effort: the visitor's request must not fail because of a notice)
    try {
      await notifyAdmins(prisma, { title: "Yeni müraciət", body: `${parentName} · ${studentName} (${studentAge} yaş) sınaq dərsinə yazıldı.`, type: "info", event: "NEW_APPLICATION", entityType: "application", entityId: booking.id });
    } catch (e) {
      console.error("[trial] admin notification failed", e);
    }
    return { status: "success", bookingId: booking.id };
  } catch (e) {
    console.error("[trial] could not save the request", e);
    return { status: "error", message: "Texniki xəta baş verdi. Bir az sonra yenidən cəhd edin." };
  }
}
