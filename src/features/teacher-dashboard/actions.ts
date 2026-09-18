"use server";

// Server actions behind the teacher dashboard. Each one: authenticates,
// authorises through src/lib/access.ts (ids from the browser are resolved
// against the teacher's real classes/students), then changes the record and
// its side effects — audit entry, parent/student notifications — in ONE
// transaction, so the database can never hold the change without its trail
// or the trail without the change. Every dashboard reads these same rows.
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NoteVisibility } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AccessError,
  accessResult,
  requireTeacher,
  requireTeacherOwnsClass,
  requireTeacherOwnsHomework,
  requireTeacherOwnsLesson,
  requireTeacherOwnsStudent,
} from "@/lib/access";
import { audit, notifyParentsOfStudents, notifyStudents } from "@/lib/events";
import { clock, dayMonth, fromBakuLocal, parts } from "@/features/parent-dashboard/az";

type Fail = { ok: false; error: "unauthenticated" | "forbidden" | "not-found" | "invalid" | "failed" | "no-lesson" };
type Result<T = object> = ({ ok: true } & T) | Fail;
type Ok = Result<Record<never, never>>;

async function actor() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") throw new AccessError("unauthenticated");
  return session.user.id;
}

function revalidate() {
  revalidatePath("/teacher", "layout");
  revalidatePath("/parent", "layout");
  revalidatePath("/student", "layout");
}

async function run<T extends object = Record<never, never>>(fn: (userId: string) => Promise<Result<T>>): Promise<Result<T>> {
  try {
    const userId = await actor();
    const result = await fn(userId);
    if (result.ok) revalidate();
    return result;
  } catch (err) {
    if (err instanceof AccessError) return accessResult(err);
    console.error("[teacher action]", err);
    return { ok: false, error: "failed" };
  }
}

// ---- lessons (the Siniflərim calendar) ---------------------------------------------

const lessonSchema = z.object({ classId: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/) });

/** Adds a lesson to a class on a given day/time (school time); students and parents see it as "Növbəti dərs". */
export async function createLesson(input: { classId: string; date: string }): Promise<Result<{ id: string }>> {
  return run<{ id: string }>(async (userId) => {
    const parsed = lessonSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };
    const { classId } = await requireTeacherOwnsClass(userId, parsed.data.classId);
    const date = fromBakuLocal(parsed.data.date);

    const id = await prisma.$transaction(async (tx) => {
      const classGroup = await tx.classGroup.findUniqueOrThrow({ where: { id: classId }, include: { course: true, enrollments: true } });
      const duplicate = await tx.lesson.findFirst({ where: { classId, date } });
      if (duplicate) return duplicate.id;
      const lesson = await tx.lesson.create({ data: { classId, title: classGroup.course.name, description: "", date } });
      const studentIds = classGroup.enrollments.map((e) => e.studentId);
      const body = `${classGroup.course.name}: ${dayMonth(parts(date))}, ${clock(parts(date))}.`;
      await notifyParentsOfStudents(tx, studentIds, { title: "Yeni dərs planlaşdırıldı", body, category: "lessons", entityType: "lesson", entityId: lesson.id });
      await notifyStudents(tx, studentIds, { title: "Yeni dərs planlaşdırıldı", body, entityType: "lesson", entityId: lesson.id });
      await audit(tx, { actorUserId: userId, action: "lesson.create", entityType: "lesson", entityId: lesson.id, after: { classId, date: date.toISOString(), title: lesson.title } });
      return lesson.id;
    });
    return { ok: true, id };
  });
}

export async function deleteLesson(lessonId: string): Promise<Ok> {
  return run<Record<never, never>>(async (userId) => {
    const { lesson } = await requireTeacherOwnsLesson(userId, lessonId);
    await prisma.$transaction(async (tx) => {
      await audit(tx, { actorUserId: userId, action: "lesson.delete", entityType: "lesson", entityId: lesson.id, before: { classId: lesson.classId, date: lesson.date.toISOString(), title: lesson.title } });
      await tx.lesson.delete({ where: { id: lesson.id } }); // attendance + homework + submissions cascade
    });
    return { ok: true };
  });
}

// ---- attendance ------------------------------------------------------------------------

const STATUS_OF = { p: "PRESENT", l: "LATE", a: "ABSENT" } as const;
const STATUS_WORD = { PRESENT: "iştirak", ABSENT: "qayıb", LATE: "gecikmə" } as const;

/**
 * Marks attendance for a lesson: one row per student (created or updated),
 * who marked it and when, an audit entry with the previous status, and a
 * notification to the parent (and the student) when the mark is not "present"
 * or changes — all in one transaction.
 */
export async function saveAttendance(lessonId: string, marks: Record<string, "p" | "l" | "a">): Promise<Result<{ changed: number }>> {
  return run<{ changed: number }>(async (userId) => {
    const { lesson } = await requireTeacherOwnsLesson(userId, lessonId);
    const enrolled = new Set((await prisma.enrollment.findMany({ where: { classId: lesson.classId }, select: { studentId: true } })).map((e) => e.studentId));

    const changed = await prisma.$transaction(async (tx) => {
      let n = 0;
      const dateLabel = dayMonth(parts(lesson.date));
      for (const [studentId, mark] of Object.entries(marks)) {
        if (!enrolled.has(studentId) || !STATUS_OF[mark]) continue;
        const status = STATUS_OF[mark];
        const current = await tx.attendance.findFirst({ where: { lessonId, studentId } });
        if (current && current.status === status) continue;
        const row = current
          ? await tx.attendance.update({ where: { id: current.id }, data: { status, markedById: userId } })
          : await tx.attendance.create({ data: { lessonId, studentId, status, date: lesson.date, markedById: userId } });
        n += 1;
        await audit(tx, { actorUserId: userId, action: "attendance.mark", entityType: "attendance", entityId: row.id, before: current ? { status: current.status } : null, after: { status, lessonId, studentId } });
        if (status !== "PRESENT") {
          const student = await tx.studentProfile.findUniqueOrThrow({ where: { id: studentId }, select: { firstName: true } });
          const ref = { entityType: "attendance" as const, entityId: row.id };
          await notifyParentsOfStudents(tx, [studentId], {
            title: "Davamiyyət bildirişi",
            body: `${student.firstName} ${dateLabel} tarixli "${lesson.title}" dərsində ${STATUS_WORD[status]} kimi qeyd edildi.`,
            type: "warning",
            category: "lessons",
            ...ref,
          });
          await notifyStudents(tx, [studentId], { title: "Davamiyyət qeydi", body: `${dateLabel} tarixli "${lesson.title}" dərsində ${STATUS_WORD[status]} kimi qeyd edildin.`, type: "warning", ...ref });
        }
      }
      return n;
    });
    return { ok: true, changed };
  });
}

// ---- homework + grading --------------------------------------------------------------------

const hwSchema = z.object({
  classId: z.string().min(1),
  title: z.string().trim().min(3),
  description: z.string().trim().min(3),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** optional subset of the class; omitted = every enrolled student */
  studentIds: z.array(z.string().min(1)).optional(),
});

/**
 * Creates homework for a class (attached to its nearest lesson) with one
 * PENDING submission per assigned student — the submission row is what makes
 * the homework visible to that student and their parent.
 */
export async function createHomework(input: { classId: string; title: string; description: string; dueDate: string; studentIds?: string[] }): Promise<Result<{ id: string }>> {
  return run<{ id: string }>(async (userId) => {
    const parsed = hwSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };
    const { classId } = await requireTeacherOwnsClass(userId, parsed.data.classId);

    const classGroup = await prisma.classGroup.findUniqueOrThrow({ where: { id: classId }, include: { course: true, enrollments: true, lessons: { orderBy: { date: "desc" } } } });
    const now = Date.now();
    const lesson = classGroup.lessons.find((l) => l.date.getTime() <= now) ?? classGroup.lessons[classGroup.lessons.length - 1];
    if (!lesson) return { ok: false, error: "no-lesson" };
    const enrolled = classGroup.enrollments.map((e) => e.studentId);
    const assigned = parsed.data.studentIds?.length ? enrolled.filter((id) => parsed.data.studentIds!.includes(id)) : enrolled;
    if (!assigned.length) return { ok: false, error: "invalid" };

    const dueDate = new Date(`${parsed.data.dueDate}T23:59:00+04:00`);
    const id = await prisma.$transaction(async (tx) => {
      const homework = await tx.homework.create({ data: { lessonId: lesson.id, title: parsed.data.title, description: parsed.data.description, dueDate } });
      await tx.submission.createMany({ data: assigned.map((studentId) => ({ homeworkId: homework.id, studentId, status: "PENDING" as const })) });
      const body = `${classGroup.course.name}: "${homework.title}" — son tarix ${dayMonth(parts(dueDate))}.`;
      const ref = { entityType: "homework" as const, entityId: homework.id };
      await notifyParentsOfStudents(tx, assigned, { title: "Yeni ev tapşırığı", body, category: "grades", ...ref });
      await notifyStudents(tx, assigned, { title: "Yeni ev tapşırığı", body, ...ref });
      await audit(tx, { actorUserId: userId, action: "homework.create", entityType: "homework", entityId: homework.id, after: { classId, lessonId: lesson.id, title: homework.title, dueDate: dueDate.toISOString(), studentIds: assigned } });
      return homework.id;
    });
    return { ok: true, id };
  });
}

const gradeSchema = z.array(z.object({ submissionId: z.string().min(1), score: z.coerce.number().int().min(0).max(100), feedback: z.string().optional() })).min(1);

/**
 * Grades submissions of the teacher's own homework: score + feedback + GRADED,
 * the Grade row every progress chart reads, an audit entry with the previous
 * score, and notifications — per submission, in one transaction.
 */
export async function saveGrades(rows: { submissionId: string; score: number; feedback?: string }[]): Promise<Result<{ count: number }>> {
  return run<{ count: number }>(async (userId) => {
    const parsed = gradeSchema.safeParse(rows);
    if (!parsed.success) return { ok: false, error: "invalid" };
    const teacher = await requireTeacher(userId);

    const count = await prisma.$transaction(async (tx) => {
      let n = 0;
      for (const r of parsed.data) {
        const submission = await tx.submission.findFirst({
          where: { id: r.submissionId, homework: { lesson: { class: { teacherId: teacher.id } } } },
          include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
        });
        if (!submission) throw new AccessError("forbidden", "submission is not in this teacher's classes");
        const feedback = r.feedback?.trim() || null;
        await tx.submission.update({ where: { id: submission.id }, data: { status: "GRADED", score: r.score, feedback, submittedAt: submission.submittedAt ?? new Date() } });
        const grade = await tx.grade.upsert({
          where: { submissionId: submission.id },
          create: { studentId: submission.studentId, submissionId: submission.id, subject: submission.homework.lesson.class.course.name, score: r.score, maxScore: 100 },
          update: { score: r.score },
        });
        await audit(tx, { actorUserId: userId, action: "grade.set", entityType: "submission", entityId: submission.id, before: { status: submission.status, score: submission.score, feedback: submission.feedback }, after: { status: "GRADED", score: r.score, feedback, gradeId: grade.id } });
        const body = `"${submission.homework.title}" — ${r.score} bal${feedback ? `. Müəllim qeydi: ${feedback}` : ""}`;
        const ref = { entityType: "grade" as const, entityId: grade.id };
        await notifyParentsOfStudents(tx, [submission.studentId], { title: "Ev tapşırığı qiymətləndirildi", body, type: "success", category: "grades", ...ref });
        await notifyStudents(tx, [submission.studentId], { title: "Tapşırığın qiymətləndirildi", body, type: "success", ...ref });
        n += 1;
      }
      return n;
    });
    return { ok: true, count };
  });
}

// ---- notes ---------------------------------------------------------------------------------------

const noteSchema = z.object({ studentId: z.string().min(1), body: z.string().trim().min(3).max(2000), visibility: z.enum(["PRIVATE", "PARENT", "STUDENT"]) });

/**
 * Writes a note about a student. `visibility` decides who else may read it:
 * PRIVATE = only the teacher, PARENT = + the parent, STUDENT = + the student.
 * Visible notes also notify the people who may read them.
 */
export async function createStudentNote(input: { studentId: string; body: string; visibility: NoteVisibility }): Promise<Result<{ id: string }>> {
  return run<{ id: string }>(async (userId) => {
    const parsed = noteSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };
    const { teacher, studentId } = await requireTeacherOwnsStudent(userId, parsed.data.studentId);
    const teacherUser = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });

    const id = await prisma.$transaction(async (tx) => {
      const note = await tx.studentNote.create({ data: { studentId, teacherId: teacher.id, body: parsed.data.body, visibility: parsed.data.visibility } });
      const ref = { entityType: "note" as const, entityId: note.id };
      if (note.visibility !== "PRIVATE") {
        await notifyParentsOfStudents(tx, [studentId], { title: "Yeni müəllim qeydi", body: `${teacherUser.name}: ${note.body}`, category: "grades", ...ref });
      }
      if (note.visibility === "STUDENT") {
        await notifyStudents(tx, [studentId], { title: "Yeni müəllim qeydi", body: `${teacherUser.name}: ${note.body}`, ...ref });
      }
      await audit(tx, { actorUserId: userId, action: "note.create", entityType: "note", entityId: note.id, after: { studentId, visibility: note.visibility } });
      return note.id;
    });
    return { ok: true, id };
  });
}

export async function deleteStudentNote(noteId: string): Promise<Ok> {
  return run<Record<never, never>>(async (userId) => {
    const teacher = await requireTeacher(userId);
    const note = await prisma.studentNote.findFirst({ where: { id: noteId, teacherId: teacher.id } });
    if (!note) throw new AccessError("forbidden", "note is not this teacher's");
    await prisma.$transaction(async (tx) => {
      await audit(tx, { actorUserId: userId, action: "note.delete", entityType: "note", entityId: note.id, before: { studentId: note.studentId, visibility: note.visibility, body: note.body } });
      await tx.studentNote.delete({ where: { id: note.id } });
    });
    return { ok: true };
  });
}

// ---- profile ----------------------------------------------------------------------------------------

const profileSchema = z.object({ name: z.string().trim().min(3), phone: z.string().trim().min(9), position: z.string().trim().min(3) });

export async function updateTeacherProfile(formData: FormData): Promise<Ok> {
  return run<Record<never, never>>(async (userId) => {
    const parsed = profileSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone"), position: formData.get("position") });
    if (!parsed.success) return { ok: false, error: "invalid" };
    await requireTeacher(userId);
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name, phone: parsed.data.phone } }),
      prisma.teacherProfile.update({ where: { userId }, data: { position: parsed.data.position } }),
    ]);
    return { ok: true };
  });
}

export async function updateTeacherAvatar(url: string): Promise<Ok> {
  return run<Record<never, never>>(async (userId) => {
    await requireTeacher(userId);
    await prisma.$transaction([
      prisma.teacherProfile.update({ where: { userId }, data: { photoUrl: url } }),
      prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } }),
    ]);
    return { ok: true };
  });
}

// ---- skills + badges (no control in the approved teacher UI yet) ---------------------------------------

const skillSchema = z.object({ studentId: z.string().min(1), skill: z.string().trim().min(2).max(60), percent: z.coerce.number().int().min(0).max(100) });

export async function updateSkillProgress(input: { studentId: string; skill: string; percent: number }): Promise<Ok> {
  return run<Record<never, never>>(async (userId) => {
    const parsed = skillSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "invalid" };
    const { studentId } = await requireTeacherOwnsStudent(userId, parsed.data.studentId);
    await prisma.$transaction(async (tx) => {
      const existing = await tx.skillProgress.findFirst({ where: { studentId, skill: { equals: parsed.data.skill, mode: "insensitive" } } });
      const row = existing
        ? await tx.skillProgress.update({ where: { id: existing.id }, data: { percent: parsed.data.percent } })
        : await tx.skillProgress.create({ data: { studentId, skill: parsed.data.skill, percent: parsed.data.percent } });
      await audit(tx, { actorUserId: userId, action: "skill.set", entityType: "skillProgress", entityId: row.id, before: existing ? { percent: existing.percent } : null, after: { skill: row.skill, percent: row.percent } });
    });
    return { ok: true };
  });
}

export async function awardBadge(input: { studentId: string; badgeId: string }): Promise<Ok> {
  return run<Record<never, never>>(async (userId) => {
    const { studentId } = await requireTeacherOwnsStudent(userId, input.studentId);
    const badge = await prisma.badge.findUnique({ where: { id: input.badgeId } });
    if (!badge) return { ok: false, error: "not-found" };
    await prisma.$transaction(async (tx) => {
      const already = await tx.studentBadge.findFirst({ where: { studentId, badgeId: badge.id } });
      if (already) return;
      const row = await tx.studentBadge.create({ data: { studentId, badgeId: badge.id } });
      const ref = { entityType: "badge" as const, entityId: row.id };
      await notifyParentsOfStudents(tx, [studentId], { title: "Nailiyyət açıldı", body: `${badge.emoji} ${badge.name} — ${badge.description}`, type: "success", category: "grades", ...ref });
      await notifyStudents(tx, [studentId], { title: "Yeni nailiyyət", body: `${badge.emoji} ${badge.name} — ${badge.description}`, type: "success", ...ref });
      await audit(tx, { actorUserId: userId, action: "badge.award", entityType: "studentBadge", entityId: row.id, after: { badgeId: badge.id, studentId } });
    });
    return { ok: true };
  });
}
