export const SCHOLARSHIP_NAME = "Reqamsal Gələcək";
export const SCHOLARSHIP_BASE = "/teqaud";

export type SubjectKey = "LOGIC" | "MATH" | "ENGLISH";

// Exam order and the labels shown in the UI.
export const SUBJECT_ORDER: SubjectKey[] = ["LOGIC", "MATH", "ENGLISH"];
export const SUBJECTS: Record<SubjectKey, { label: string; blurb: string }> = {
  LOGIC: { label: "Məntiq", blurb: "Məntiqi düşüncə, ardıcıllıqlar və problem həlli." },
  MATH: { label: "Math", blurb: "Riyaziyyat: hesablama, həndəsə və məsələ həlli." },
  ENGLISH: { label: "English", blurb: "İngilis dilində məntiq, anlama və sözlər." },
};
export const subjectRank = (s: string) => SUBJECT_ORDER.indexOf(s as SubjectKey);

/** Math questions each candidate gets, drawn at random from the class's pool (when the pool is larger). */
export const MATH_QUESTIONS_PER_EXAM = 10;

/** How many questions an exam has, given how many exist per subject. */
export function examSize(poolBySubject: Record<string, number>): number {
  return Object.entries(poolBySubject).reduce((n, [subject, count]) => n + (subject === "MATH" ? Math.min(count, MATH_QUESTIONS_PER_EXAM) : count), 0);
}

/**
 * Scholarship (discount) for a result: everyone who completes the exam gets at least
 * MIN_SCHOLARSHIP percent (brief: "min 60"). Above that the ladder below applies — ASSUMPTION,
 * the brief only fixes the minimum, so adjust the steps here.
 */
export const MIN_SCHOLARSHIP = 60;
export const SCHOLARSHIP_TIERS: { minPercent: number; scholarship: number }[] = [
  { minPercent: 90, scholarship: 90 },
  { minPercent: 80, scholarship: 80 },
  { minPercent: 70, scholarship: 70 },
];
export const scholarshipFor = (percent: number) => SCHOLARSHIP_TIERS.find((t) => percent >= t.minPercent)?.scholarship ?? MIN_SCHOLARSHIP;

/** 1.5 minutes per question, rounded up to a multiple of 5. */
export function examDurationMinutes(totalQuestions: number): number {
  return Math.max(5, Math.ceil((totalQuestions * 1.5) / 5) * 5);
}

export const SESSION_MAX_AGE_SECONDS = 6 * 60 * 60;
// Time allowed after expiry for the final autosave/submit request to arrive.
export const SUBMIT_GRACE_MS = 15_000;

export const MSG = {
  required: "Bütün xanaları doldurun.",
  finTaken: "FIN artıq qeydiyyatdan keçib.",
  codeInvalid: "Kod düzgün deyil. 32 simvoldan ibarət kursun verdiyi kodu daxil edin.",
  codeUsed: "Bu kod artıq istifadə olunub.",
  finInvalid: "FIN 7 simvoldan ibarət olmalıdır (böyük latın hərfləri və rəqəmlər).",
  tooMany: "Çox sayda cəhd edildi. Bir az sonra yenidən cəhd edin.",
  sessionExpired: "Sessiya müddəti bitib. Zəhmət olmasa yenidən daxil olun.",
  noQuestions: "Seçdiyiniz sinif üçün suallar tapılmadı.",
  examLoadFailed: "İmtahan məlumatları yüklənmədi.",
  examNotStarted: "İmtahan hələ başlamayıb.",
  examFinished: "İmtahan artıq tamamlanıb.",
  badCategory: "Seçdiyiniz sinif düzgün deyil.",
  badRequest: "Sorğu düzgün deyil.",
  forbidden: "Bu əməliyyata icazə verilmir.",
  server: "Texniki xəta baş verdi. Bir az sonra yenidən cəhd edin.",
} as const;
