// School-wide configuration stored in the Setting table (key → JSON value). Anything not set
// falls back to SETTING_DEFAULTS, so a fresh database works without seeding.
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/events";

export const SETTING_DEFAULTS = {
  "school.name": "Saleh Tech School",
  "school.phone": "",
  "school.email": "",
  "school.address": "",
  /** prefilled lesson length in the schedule form (minutes) */
  "lesson.defaultMinutes": 60,
  /** completed lessons that open one payment cycle — the default for NEW classes */
  "billing.lessonsPerCycle": 8,
  /** a DUE payment older than this many days is reported as overdue */
  "billing.overdueDays": 7,
  /** default capacity of a new class; 0 = unlimited */
  "class.defaultCapacity": 0,
  /** also tell parents/students when a payment cycle becomes due (admins are always told) */
  "notify.paymentDueToFamilies": true,
} as const;

export type Settings = { -readonly [K in keyof typeof SETTING_DEFAULTS]: (typeof SETTING_DEFAULTS)[K] extends number ? number : (typeof SETTING_DEFAULTS)[K] extends boolean ? boolean : string };

export const settingsSchema = z
  .object({
    "school.name": z.string().trim().min(2, "Məktəbin adı ən az 2 simvol olmalıdır.").max(80),
    "school.phone": z.string().trim().max(40),
    "school.email": z.string().trim().max(120).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "E-poçt ünvanı düzgün deyil."),
    "school.address": z.string().trim().max(160),
    "lesson.defaultMinutes": z.number().int().min(15, "Dərs müddəti ən az 15 dəqiqə olmalıdır.").max(240),
    "billing.lessonsPerCycle": z.number().int().min(1, "Ən az 1 dərs.").max(40),
    "billing.overdueDays": z.number().int().min(0).max(120),
    "class.defaultCapacity": z.number().int().min(0).max(500),
    "notify.paymentDueToFamilies": z.boolean(),
  })
  .partial();

export async function getSettings(db: Pick<typeof prisma, "setting"> = prisma): Promise<Settings> {
  const rows = await db.setting.findMany();
  const out: Record<string, unknown> = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in SETTING_DEFAULTS && typeof r.value === typeof (SETTING_DEFAULTS as Record<string, unknown>)[r.key]) out[r.key] = r.value;
  return out as Settings;
}

export async function updateSettings(actorUserId: string, input: z.infer<typeof settingsSchema>) {
  return prisma.$transaction(async (tx) => {
    const before = await getSettings(tx);
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      await tx.setting.upsert({ where: { key }, create: { key, value: value as never }, update: { value: value as never } });
    }
    const after = await getSettings(tx);
    await audit(tx, { actorUserId, action: "settings.update", entityType: "settings", entityId: "school", before, after });
    return after;
  });
}
