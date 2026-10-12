// Admissions = the existing TrialBooking pipeline (website "sınaq dərsi" requests). Stages reuse LeadStage:
// NEW → CONTACTED → TRIAL_LESSON → TRIAL_COMPLETED → INTERESTED → REGISTERED (= enrolled), or REJECTED.
// REGISTERED can only be reached by converting the application into a real student account.
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit } from "@/lib/events";
import { addStudentsToClassTx } from "@/lib/admin/classes";
import { createStudentTx, studentCreateSchema } from "@/lib/admin/students";

export const LEAD_STAGES = ["NEW", "CONTACTED", "TRIAL_LESSON", "TRIAL_COMPLETED", "INTERESTED", "REGISTERED", "REJECTED"] as const;
export const stageSchema = z.object({ stage: z.enum(["NEW", "CONTACTED", "TRIAL_LESSON", "TRIAL_COMPLETED", "INTERESTED", "REJECTED"], { errorMap: () => ({ message: "Mərhələ düzgün deyil. “Qeydiyyatdan keçib” yalnız tələbə yaradılanda təyin olunur." }) }), adminNote: z.string().trim().max(500).nullable().optional() });
export const convertSchema = z.object({ student: studentCreateSchema, classId: z.string().min(1).optional() });

const select = {
  id: true, parentName: true, parentPhone: true, studentName: true, studentAge: true, preferredDate: true, preferredTime: true, stage: true, createdAt: true, adminNote: true, convertedStudentId: true,
  course: { select: { id: true, name: true } },
} satisfies Prisma.TrialBookingSelect;
const present = (r: Prisma.TrialBookingGetPayload<{ select: typeof select }>) => ({
  id: r.id, parentName: r.parentName, parentPhone: r.parentPhone, studentName: r.studentName, studentAge: r.studentAge,
  preferredDate: r.preferredDate.toISOString(), preferredTime: r.preferredTime, stage: r.stage, createdAt: r.createdAt.toISOString(), adminNote: r.adminNote,
  convertedStudentId: r.convertedStudentId, courseId: r.course?.id ?? null, courseName: r.course?.name ?? null,
});

export async function listApplications(p: { q?: string; stage?: string; page: number; size: number }) {
  const where: Prisma.TrialBookingWhereInput = {
    ...(p.stage && (LEAD_STAGES as readonly string[]).includes(p.stage) ? { stage: p.stage as never } : {}),
    ...(p.q ? { OR: [{ parentName: { contains: p.q, mode: "insensitive" } }, { studentName: { contains: p.q, mode: "insensitive" } }, { parentPhone: { contains: p.q } }] } : {}),
  };
  const [total, rows, byStage] = await Promise.all([
    prisma.trialBooking.count({ where }),
    prisma.trialBooking.findMany({ where, select, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.size, take: p.size }),
    prisma.trialBooking.groupBy({ by: ["stage"], _count: { _all: true } }),
  ]);
  return { total, items: rows.map(present), counts: Object.fromEntries(byStage.map((b) => [b.stage, b._count._all])) as Record<string, number> };
}

export async function setApplicationStage(actorUserId: string, id: string, input: z.infer<typeof stageSchema>) {
  const row = await prisma.$transaction(async (tx) => {
    const cur = await tx.trialBooking.findUnique({ where: { id } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    if (cur.stage === "REGISTERED") throw new ApiError(409, "Tələbəyə çevrilmiş müraciətin mərhələsi dəyişdirilə bilməz.");
    const updated = await tx.trialBooking.update({ where: { id }, data: { stage: input.stage, ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}) }, select });
    await audit(tx, { actorUserId, action: "application.stage", entityType: "application", entityId: id, before: { stage: cur.stage }, after: { stage: input.stage } });
    return updated;
  });
  return present(row);
}

/** Application → student account (+ parent) → optional class, all or nothing. */
export async function convertApplication(actorUserId: string, id: string, input: z.infer<typeof convertSchema>) {
  const studentId = await prisma.$transaction(async (tx) => {
    const lead = await tx.trialBooking.findUnique({ where: { id }, select: { id: true, stage: true, convertedStudentId: true } });
    if (!lead) throw new ApiError(404, MSG.notFound);
    if (lead.convertedStudentId || lead.stage === "REGISTERED") throw new ApiError(409, "Bu müraciət artıq tələbəyə çevrilib.");
    const sid = await createStudentTx(tx, actorUserId, input.student);
    if (input.classId) await addStudentsToClassTx(tx, actorUserId, input.classId, [sid]);
    await tx.trialBooking.update({ where: { id }, data: { stage: "REGISTERED", convertedStudentId: sid } });
    await audit(tx, { actorUserId, action: "application.convert", entityType: "application", entityId: id, before: { stage: lead.stage }, after: { stage: "REGISTERED", studentId: sid, classId: input.classId ?? null } });
    return sid;
  });
  return { studentId };
}
