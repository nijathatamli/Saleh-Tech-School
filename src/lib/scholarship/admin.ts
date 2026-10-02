import "server-only";
import { prisma } from "@/lib/prisma";
import { SUBJECTS, scholarshipFor, type SubjectKey } from "./config";
import { decryptFin } from "./security";

export type AdminStudentRow = {
  id: string;
  name: string;
  surname: string;
  category: string;
  fin: string;
  phone: string;
  email: string;
  language: string;
  registeredAt: Date;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED";
  score: number | null;
  total: number | null;
  percent: number | null;
  scholarshipPercent: number | null;
  subjects: { label: string; correct: number; total: number }[];
  finishedAt: Date | null;
  timedOut: boolean;
};

export async function getScholarshipAdminData() {
  const [students, codes] = await Promise.all([
    prisma.scholarshipStudent.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: { select: { label: true } }, attempts: true },
    }),
    prisma.scholarshipCode.findMany({ orderBy: { createdAt: "desc" }, include: { student: { select: { name: true, surname: true } } }, take: 500 }),
  ]);

  const rows: AdminStudentRow[] = students.map((s) => {
    const a = s.attempts[0];
    let fin = "—";
    try {
      fin = decryptFin(s.finEncrypted);
    } catch {
      /* key changed: leave blank rather than break the page */
    }
    const subjects = ((a?.subjectScores as { subject: SubjectKey; correct: number; total: number }[] | null) ?? []).map((x) => ({
      label: SUBJECTS[x.subject]?.label ?? x.subject,
      correct: x.correct,
      total: x.total,
    }));
    return {
      id: s.id,
      name: s.name,
      surname: s.surname,
      category: s.category.label,
      fin,
      phone: s.phone,
      email: s.email,
      language: s.language,
      registeredAt: s.createdAt,
      status: !a ? "NOT_STARTED" : a.status,
      score: a?.score ?? null,
      total: a?.status === "SUBMITTED" ? a.total : null,
      percent: a?.percent ?? null,
      // derived from the stored mark so a change to the tier table applies to past exams too
      scholarshipPercent: a?.status === "SUBMITTED" ? scholarshipFor(a.percent ?? 0) : null,
      subjects,
      finishedAt: a?.finishedAt ?? null,
      timedOut: a?.timedOut ?? false,
    };
  });

  return {
    students: rows,
    codes: codes.map((c) => ({ id: c.id, code: c.code, note: c.note, createdAt: c.createdAt, usedAt: c.usedAt, usedBy: c.student ? `${c.student.name} ${c.student.surname}` : null })),
  };
}
