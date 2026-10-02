import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { MATH_QUESTIONS_PER_EXAM, SUBJECTS, SUBJECT_ORDER, SUBMIT_GRACE_MS, examDurationMinutes, examSize, scholarshipFor, subjectRank, type SubjectKey } from "./config";
import { SUBJECT_LABELS, type Lang } from "./i18n";
import { sanitizeRich } from "./rich-text";

type StoredOption = { label: string; html: string };
type Answers = Record<string, string | null>;

export type PublicQuestion = {
  id: string;
  subject: SubjectKey;
  subjectLabel: string;
  indexInSubject: number;
  subjectTotal: number;
  stem: string;
  options: StoredOption[];
  images: string[];
  typed: boolean;
};

/** Marks live only in the database and the admin panel — candidates never get them back. */
export type ExamResult = {
  score: number;
  total: number;
  percent: number;
  scholarshipPercent: number;
  subjects: { subject: SubjectKey; label: string; correct: number; total: number }[];
  finishedAt: string;
  timedOut: boolean;
};

export type ExamState =
  | {
      status: "NOT_STARTED";
      categoryLabel: string;
      durationMinutes: number;
      subjects: { subject: SubjectKey; label: string }[];
    }
  | {
      status: "IN_PROGRESS";
      startedAt: string;
      expiresAt: string;
      serverNow: string;
      questions: PublicQuestion[];
      answers: Answers;
    }
  | { status: "SUBMITTED"; finishedAt: string; timedOut: boolean };

const norm = (s: string) => s.trim().toLowerCase().replace(/,/g, ".").replace(/\s+/g, " ");

// ------------------------------------------------------------------ scoring
type Scorable = { id: string; subject: string; options: unknown; correctLabel: string | null; answerText: string | null };

export function isCorrect(q: Scorable, answer: string | null | undefined): boolean {
  if (!answer) return false;
  if (q.answerText) return norm(answer) === norm(q.answerText);
  return !!q.correctLabel && answer === q.correctLabel;
}

export function scoreAnswers(questions: Scorable[], answers: Answers) {
  const bySubject: Record<string, { correct: number; total: number }> = {};
  let score = 0;
  for (const q of questions) {
    const s = (bySubject[q.subject] ??= { correct: 0, total: 0 });
    s.total += 1;
    if (isCorrect(q, answers[q.id])) {
      s.correct += 1;
      score += 1;
    }
  }
  const total = questions.length;
  const subjects = SUBJECT_ORDER.filter((k) => bySubject[k]).map((k) => ({ subject: k, label: SUBJECTS[k].label, ...bySubject[k] }));
  return { score, total, percent: total ? Math.round((score / total) * 100) : 0, subjects };
}

// ------------------------------------------------------------------ answer validation
/** Returns the cleaned answer, `null` to clear, or `undefined` if invalid for this question. */
export function cleanAnswer(options: unknown, raw: string | null): string | null | undefined {
  if (raw === null || raw === "") return null;
  const opts = (options as StoredOption[]) ?? [];
  if (opts.length) return opts.some((o) => o.label === raw) ? raw : undefined;
  const t = raw.trim();
  return /^[\p{L}\p{N}.,\-+/% ]{1,40}$/u.test(t) ? t : undefined;
}

// ------------------------------------------------------------------ state
type Tr = { stem: string; options: StoredOption[] };

function toPublic(
  rows: { id: string; subject: string; stem: string; options: unknown; imageIds: string[]; answerText: string | null; translations: unknown }[],
  lang: Lang,
): PublicQuestion[] {
  const totals: Record<string, number> = {};
  rows.forEach((r) => (totals[r.subject] = (totals[r.subject] ?? 0) + 1));
  const seen: Record<string, number> = {};
  return rows.map((r) => {
    seen[r.subject] = (seen[r.subject] ?? 0) + 1;
    // Azerbaijani is the base text; English subject questions are English in every language
    const tr = lang === "az" ? undefined : ((r.translations as Record<string, Tr> | null) ?? {})[lang];
    const options = ((tr?.options ?? (r.options as StoredOption[])) ?? []).map((o) => ({ label: o.label, html: sanitizeRich(o.html) }));
    return {
      id: r.id,
      subject: r.subject as SubjectKey,
      subjectLabel: SUBJECT_LABELS[lang][r.subject as SubjectKey],
      indexInSubject: seen[r.subject],
      subjectTotal: totals[r.subject],
      stem: sanitizeRich(tr?.stem ?? r.stem),
      options,
      images: r.imageIds.map((id) => `/api/scholarship/media/${id}`),
      typed: options.length === 0,
    };
  });
}

export function resultOf(a: { score: number | null; total: number; percent: number | null; scholarshipPercent: number | null; subjectScores: unknown; finishedAt: Date | null; timedOut: boolean }): ExamResult {
  return {
    score: a.score ?? 0,
    total: a.total,
    percent: a.percent ?? 0,
    scholarshipPercent: a.scholarshipPercent ?? 0,
    subjects: (a.subjectScores as ExamResult["subjects"]) ?? [],
    finishedAt: (a.finishedAt ?? new Date()).toISOString(),
    timedOut: a.timedOut,
  };
}

async function finalize(attemptId: string, answers: Answers, timedOut: boolean) {
  const attempt = await prisma.scholarshipAttempt.findUniqueOrThrow({ where: { id: attemptId } });
  const questions = await prisma.scholarshipQuestion.findMany({ where: { id: { in: attempt.questionIds } } });
  const { score, total, percent, subjects } = scoreAnswers(questions, answers);
  // Only the first finalisation wins; a concurrent submit just reads the stored result.
  await prisma.scholarshipAttempt.updateMany({
    where: { id: attemptId, status: "IN_PROGRESS" },
    data: {
      status: "SUBMITTED",
      finishedAt: new Date(),
      answers: answers as Prisma.InputJsonValue,
      score,
      total,
      percent,
      scholarshipPercent: scholarshipFor(percent),
      subjectScores: subjects as unknown as Prisma.InputJsonValue,
      timedOut,
    },
  });
  return prisma.scholarshipAttempt.findUniqueOrThrow({ where: { id: attemptId } });
}

export async function getExamState(studentId: string, categoryKey: string, categoryLabel: string, lang: Lang = "az"): Promise<ExamState | { status: "NO_QUESTIONS" }> {
  let attempt = await prisma.scholarshipAttempt.findUnique({ where: { studentId } });

  if (attempt?.status === "IN_PROGRESS" && attempt.expiresAt.getTime() < Date.now()) {
    attempt = await finalize(attempt.id, (attempt.answers as Answers) ?? {}, true);
  }
  if (attempt?.status === "SUBMITTED") return { status: "SUBMITTED", finishedAt: (attempt.finishedAt ?? new Date()).toISOString(), timedOut: attempt.timedOut };

  if (attempt) {
    const rows = await prisma.scholarshipQuestion.findMany({ where: { id: { in: attempt.questionIds } } });
    const order = new Map(attempt.questionIds.map((id, i) => [id, i]));
    rows.sort((a, b) => order.get(a.id)! - order.get(b.id)!);
    return {
      status: "IN_PROGRESS",
      startedAt: attempt.startedAt.toISOString(),
      expiresAt: attempt.expiresAt.toISOString(),
      serverNow: new Date().toISOString(),
      questions: toPublic(rows, lang),
      answers: (attempt.answers as Answers) ?? {},
    };
  }

  const counts = await prisma.scholarshipQuestion.groupBy({ by: ["subject"], where: { categoryKey }, _count: { _all: true } });
  const total = examSize(Object.fromEntries(counts.map((c) => [c.subject, c._count._all])));
  if (!total) return { status: "NO_QUESTIONS" };
  return {
    status: "NOT_STARTED",
    categoryLabel,
    durationMinutes: examDurationMinutes(total),
    subjects: SUBJECT_ORDER.filter((k) => counts.some((c) => c.subject === k)).map((k) => ({ subject: k, label: SUBJECT_LABELS[lang][k] })),
  };
}

export async function startExam(studentId: string, categoryKey: string): Promise<"started" | "exists" | "no-questions"> {
  const existing = await prisma.scholarshipAttempt.findUnique({ where: { studentId }, select: { id: true } });
  if (existing) return "exists";

  const rows = await prisma.scholarshipQuestion.findMany({
    where: { categoryKey },
    select: { id: true, subject: true, part: true, number: true },
  });
  if (!rows.length) return "no-questions";

  // Math: every candidate gets MATH_QUESTIONS_PER_EXAM questions drawn at random from the
  // class's whole math pool (both parts); the draw is frozen in the attempt.
  const math = rows.filter((r) => r.subject === "MATH");
  let chosen = rows;
  if (math.length > MATH_QUESTIONS_PER_EXAM) {
    const pool = [...math];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = new Set(pool.slice(0, MATH_QUESTIONS_PER_EXAM).map((r) => r.id));
    chosen = rows.filter((r) => r.subject !== "MATH" || picked.has(r.id));
  }
  const rows2 = chosen;
  rows2.sort((a, b) => subjectRank(a.subject) - subjectRank(b.subject) || a.part - b.part || a.number - b.number);

  const now = Date.now();
  try {
    await prisma.scholarshipAttempt.create({
      data: {
        studentId,
        questionIds: rows2.map((r) => r.id),
        total: rows2.length,
        startedAt: new Date(now),
        expiresAt: new Date(now + examDurationMinutes(rows2.length) * 60_000),
      },
    });
  } catch (e) {
    // two tabs clicking "start" at once: the unique studentId guarantees a single attempt
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return "exists";
    throw e;
  }
  return "started";
}

type AttemptError = "not-started" | "finished" | "expired" | "bad-question" | "bad-answer";

export async function saveAnswer(studentId: string, questionId: string, raw: string | null): Promise<{ ok: true } | { ok: false; error: AttemptError }> {
  const attempt = await prisma.scholarshipAttempt.findUnique({ where: { studentId } });
  if (!attempt) return { ok: false, error: "not-started" };
  if (attempt.status !== "IN_PROGRESS") return { ok: false, error: "finished" };
  if (attempt.expiresAt.getTime() + SUBMIT_GRACE_MS < Date.now()) return { ok: false, error: "expired" };
  if (!attempt.questionIds.includes(questionId)) return { ok: false, error: "bad-question" };

  const q = await prisma.scholarshipQuestion.findUnique({ where: { id: questionId }, select: { options: true } });
  const cleaned = q ? cleanAnswer(q.options, raw) : undefined;
  if (cleaned === undefined) return { ok: false, error: "bad-answer" };

  // atomic merge: concurrent autosaves of different questions must not overwrite each other
  await prisma.$executeRaw`
    UPDATE "ScholarshipAttempt"
    SET "answers" = CASE WHEN ${cleaned}::text IS NULL THEN "answers" - ${questionId}::text
                         ELSE "answers" || jsonb_build_object(${questionId}::text, ${cleaned}::text) END,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${attempt.id} AND "status" = 'IN_PROGRESS'`;
  return { ok: true };
}

export async function submitExam(studentId: string, finalAnswers?: Record<string, string | null>): Promise<{ ok: true } | { ok: false; error: AttemptError }> {
  const attempt = await prisma.scholarshipAttempt.findUnique({ where: { studentId } });
  if (!attempt) return { ok: false, error: "not-started" };
  if (attempt.status === "SUBMITTED") return { ok: true };

  const now = Date.now();
  const late = attempt.expiresAt.getTime() + SUBMIT_GRACE_MS < now;
  const answers: Answers = { ...((attempt.answers as Answers) ?? {}) };

  if (!late && finalAnswers) {
    const rows = await prisma.scholarshipQuestion.findMany({ where: { id: { in: attempt.questionIds } }, select: { id: true, options: true } });
    const byId = new Map(rows.map((r) => [r.id, r.options]));
    for (const [qid, raw] of Object.entries(finalAnswers)) {
      if (!byId.has(qid)) continue; // ignore ids that are not part of this attempt
      const cleaned = cleanAnswer(byId.get(qid), raw);
      if (cleaned === undefined) continue;
      if (cleaned === null) delete answers[qid];
      else answers[qid] = cleaned;
    }
  }
  await finalize(attempt.id, answers, late || attempt.expiresAt.getTime() < now);
  return { ok: true };
}
