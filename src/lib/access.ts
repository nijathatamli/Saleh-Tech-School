// Authorization for the platform. Every dashboard action and loader goes
// through these checks; the ids a browser sends (studentId, classId,
// lessonId, homeworkId, submissionId) are never trusted on their own —
// each is resolved against the signed-in user's real relationships in the
// database (parent → children, teacher → classes → enrollments, student → self).
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class AccessError extends Error {
  constructor(
    public readonly code: "unauthenticated" | "forbidden" | "not-found",
    message?: string
  ) {
    super(message ?? code);
  }
}

type Db = Prisma.TransactionClient | typeof prisma;

/** Parent profile of a user — throws when the user is not a parent. */
export async function requireParent(userId: string, db: Db = prisma) {
  const parent = await db.parentProfile.findUnique({ where: { userId }, select: { id: true, userId: true } });
  if (!parent) throw new AccessError("forbidden", "not a parent");
  return parent;
}

/** Teacher profile of a user — throws when the user is not a teacher. */
export async function requireTeacher(userId: string, db: Db = prisma) {
  const teacher = await db.teacherProfile.findUnique({ where: { userId }, select: { id: true, userId: true } });
  if (!teacher) throw new AccessError("forbidden", "not a teacher");
  return teacher;
}

/** Student profile of a user — throws when the user is not a student. */
export async function requireStudent(userId: string, db: Db = prisma) {
  const student = await db.studentProfile.findUnique({ where: { userId }, select: { id: true, userId: true, parentId: true } });
  if (!student) throw new AccessError("forbidden", "not a student");
  return student;
}

/** The student must be one of this parent's children. */
export async function requireParentOfStudent(userId: string, studentId: string, db: Db = prisma) {
  const parent = await requireParent(userId, db);
  const child = await db.studentProfile.findFirst({ where: { id: studentId, parentId: parent.id }, select: { id: true } });
  if (!child) throw new AccessError("forbidden", "student is not this parent's child");
  return { parent, studentId: child.id };
}

/** The class must belong to this teacher. */
export async function requireTeacherOwnsClass(userId: string, classId: string, db: Db = prisma) {
  const teacher = await requireTeacher(userId, db);
  const classGroup = await db.classGroup.findFirst({ where: { id: classId, teacherId: teacher.id }, select: { id: true } });
  if (!classGroup) throw new AccessError("forbidden", "class is not taught by this teacher");
  return { teacher, classId: classGroup.id };
}

/** The lesson must belong to one of this teacher's classes. */
export async function requireTeacherOwnsLesson(userId: string, lessonId: string, db: Db = prisma) {
  const teacher = await requireTeacher(userId, db);
  const lesson = await db.lesson.findFirst({ where: { id: lessonId, class: { teacherId: teacher.id } }, include: { class: true } });
  if (!lesson) throw new AccessError("forbidden", "lesson is not taught by this teacher");
  return { teacher, lesson };
}

/** The student must be enrolled in one of this teacher's classes. */
export async function requireTeacherOwnsStudent(userId: string, studentId: string, db: Db = prisma) {
  const teacher = await requireTeacher(userId, db);
  const enrollment = await db.enrollment.findFirst({ where: { studentId, class: { teacherId: teacher.id } }, select: { studentId: true } });
  if (!enrollment) throw new AccessError("forbidden", "student is not taught by this teacher");
  return { teacher, studentId: enrollment.studentId };
}

/** The homework must belong to one of this teacher's classes. */
export async function requireTeacherOwnsHomework(userId: string, homeworkId: string, db: Db = prisma) {
  const teacher = await requireTeacher(userId, db);
  const homework = await db.homework.findFirst({
    where: { id: homeworkId, lesson: { class: { teacherId: teacher.id } } },
    include: { lesson: { include: { class: { include: { course: true } } } } },
  });
  if (!homework) throw new AccessError("forbidden", "homework is not taught by this teacher");
  return { teacher, homework };
}

/** The submission must belong to this student (their own homework). */
export async function requireStudentOwnsSubmission(userId: string, submissionId: string, db: Db = prisma) {
  const student = await requireStudent(userId, db);
  const submission = await db.submission.findFirst({ where: { id: submissionId, studentId: student.id }, include: { homework: { include: { lesson: { include: { class: true } } } } } });
  if (!submission) throw new AccessError("forbidden", "submission is not this student's");
  return { student, submission };
}

/** Which notes a viewer may read about a student, as a Prisma `where` fragment. */
export function noteVisibilityFor(role: "TEACHER" | "PARENT" | "STUDENT"): Prisma.StudentNoteWhereInput {
  if (role === "TEACHER") return {}; // callers scope to the teacher's own students/classes
  if (role === "PARENT") return { visibility: { in: ["PARENT", "STUDENT"] } };
  return { visibility: "STUDENT" };
}

/** Maps an AccessError (or anything else) to the {ok:false,error} shape the dashboards render. */
export function accessResult(err: unknown): { ok: false; error: "unauthenticated" | "forbidden" | "not-found" | "invalid" | "failed" } {
  if (err instanceof AccessError) return { ok: false, error: err.code };
  return { ok: false, error: "failed" };
}
