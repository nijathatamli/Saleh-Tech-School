import { z } from "zod";
import { MSG } from "./config";

export function normalizeFin(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

const finSchema = z
  .string({ required_error: MSG.required })
  .transform(normalizeFin)
  .refine((v) => /^[A-Z0-9]{7}$/.test(v), MSG.finInvalid);

const nameSchema = (label: string) =>
  z
    .string({ required_error: MSG.required })
    .transform((v) => v.trim().replace(/\s+/g, " "))
    .refine((v) => v.length >= 2, `${label} ən az 2 hərf olmalıdır.`)
    .refine((v) => v.length <= 40, `${label} çox uzundur.`)
    .refine((v) => /^[\p{L}][\p{L}'’ .-]*$/u.test(v), `${label} yalnız hərflərdən ibarət olmalıdır.`);

/** Course codes are 32 characters; spaces and dashes (used to group them for reading) are ignored. */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function normalizeCode(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}
const codeSchema = z
  .string({ required_error: MSG.required })
  .transform(normalizeCode)
  .refine((v) => /^[A-HJ-NP-Z2-9]{32}$/.test(v), MSG.codeInvalid);

const phoneSchema = z
  .string({ required_error: MSG.required })
  .transform((v) => v.trim().replace(/[\s().-]/g, ""))
  .refine((v) => /^\+?\d{9,15}$/.test(v), "Telefon nömrəsi düzgün deyil (məsələn: +994501234567).");

const emailSchema = z
  .string({ required_error: MSG.required })
  .transform((v) => v.trim().toLowerCase())
  .refine((v) => v.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "E-poçt ünvanı düzgün deyil.");

export const registerSchema = z
  .object({
    name: nameSchema("Ad"),
    surname: nameSchema("Soyad"),
    category: z.string({ required_error: MSG.required }).trim().min(1, MSG.required).max(20),
    fin: finSchema,
    phone: phoneSchema,
    email: emailSchema,
    code: codeSchema,
    language: z.enum(["az", "en", "ru"]).default("az"),
  });

export const answerSchema = z.object({
  questionId: z.string().min(1).max(60),
  answer: z.union([z.string().max(40), z.null()]),
});

export const submitSchema = z.object({
  answers: z.record(z.string().max(60), z.string().max(40).nullable()).optional(),
});

/** First error message per field, for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
