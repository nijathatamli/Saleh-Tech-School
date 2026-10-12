// Lesson scheduling and completion used by BOTH the teacher dashboard actions and the REST routes,
// so there is exactly one implementation of "create a lesson" and "mark a lesson completed".
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { AccessError, requireStudent, requireTeacher, requireTeacherOwnsClass, requireTeacherOwnsLesson } from "@/lib/access";
import { COMPLETING, cycleProgress, isCompleting, setParticipation } from "@/lib/billing";
import { scheduleLesson } from "@/lib/schedule";

export const lessonCreateSchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Tarix düzgün deyil.") });

/** Adds a lesson to a class the teacher owns (school time "YYYY-MM-DDTHH:mm"); same slot twice returns the existing lesson; clashes are refused. */
export async function createLessonFor(userId: string, classId: string, localDate: string) {
  const { classId: ownedId } = await requireTeacherOwnsClass(userId, classId);
  return scheduleLesson(userId, { classId: ownedId, date: localDate });
}

export const completeSchema = z.object({ studentIds: z.array(z.string().min(1)).min(1, "Ən azı bir tələbə seçin.").max(300) });

/**
 * "Dərsi tamamlandı": the teacher confirms these students took part in the lesson.
 * Validates ownership of the lesson and membership of every student, then — in one transaction —
 * records the completion, recalculates progress, opens a payment cycle when the threshold is
 * reached and notifies the admins. Repeating the request changes nothing.
 */
export async function completeLesson(userId: string, lessonId: string, studentIds: string[]) {
  const { lesson } = await requireTeacherOwnsLesson(userId, lessonId);
  const ids = [...new Set(studentIds)];
  const members = await prisma.enrollment.findMany({ where: { classId: lesson.classId, studentId: { in: ids } }, select: { studentId: true } });
  if (members.length !== ids.length) throw new ApiError(404, "Seçilmiş tələbə bu sinifdə deyil.", { studentIds: "Seçilmiş tələbə bu sinifdə deyil." });

  try {
    return await prisma.$transaction(async (tx) => {
      const out = [];
      for (const studentId of ids) {
        const current = await tx.attendance.findUnique({ where: { lessonId_studentId: { lessonId, studentId } } });
        const status = current && isCompleting(current.status) ? current.status : "PRESENT";
        const res = await setParticipation(tx, { actorUserId: userId, lesson: { id: lesson.id, classId: lesson.classId, date: lesson.date }, studentId, status, confirm: true });
        const completed = await tx.attendance.count({ where: { studentId, completed: true, lesson: { classId: lesson.classId } } });
        out.push({ studentId, changed: res.changed, completedLessons: completed, progress: cycleProgress(completed, lesson.class.lessonsPerCycle), cycleSize: lesson.class.lessonsPerCycle, paymentsOpened: res.payments.length });
      }
      return out;
    });
  } catch (e) {
    if (e instanceof ApiError || e instanceof AccessError) throw e;
    console.error("[completeLesson]", e);
    throw new ApiError(422, MSG.lessonComplete);
  }
}

// ------------------------------------------------------------------ read models for the dashboards
export async function teacherClasses(userId: string) {
  const teacher = await requireTeacher(userId);
  const rows = await prisma.classGroup.findMany({
    where: { teacherId: teacher.id, status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, schedule: true, lessonsPerCycle: true, course: { select: { name: true } }, _count: { select: { enrollments: true, lessons: true } } },
  });
  return rows.map((c) => ({ id: c.id, name: c.name, courseName: c.course.name, schedule: c.schedule, students: c._count.enrollments, lessons: c._count.lessons, lessonsPerCycle: c.lessonsPerCycle }));
}

export async function teacherClassProgress(userId: string, classId: string) {
  const { classId: id } = await requireTeacherOwnsClass(userId, classId);
  const cls = await prisma.classGroup.findUniqueOrThrow({
    where: { id },
    select: {
      name: true, lessonsPerCycle: true,
      enrollments: { orderBy: { startedAt: "asc" }, select: { student: { select: { id: true, firstName: true, lastName: true, grade: true } } } },
      lessons: { orderBy: { date: "asc" }, select: { id: true, title: true, date: true } },
    },
  });
  const att = await prisma.attendance.findMany({ where: { lesson: { classId: id } }, select: { studentId: true, lessonId: true, status: true, completed: true } });
  const students = cls.enrollments.map((e) => {
    const mine = att.filter((a) => a.studentId === e.student.id);
    const completed = mine.filter((a) => a.completed).length;
    const present = mine.filter((a) => COMPLETING.includes(a.status)).length;
    return {
      studentId: e.student.id, name: `${e.student.firstName} ${e.student.lastName}`, grade: e.student.grade,
      lessonsRecorded: mine.length, attended: present, completedLessons: completed,
      progress: cycleProgress(completed, cls.lessonsPerCycle), cycleSize: cls.lessonsPerCycle,
    };
  });
  return {
    class: { id, name: cls.name, cycleSize: cls.lessonsPerCycle },
    students,
    lessons: cls.lessons.map((l) => ({ id: l.id, title: l.title, date: l.date.toISOString(), completedBy: att.filter((a) => a.lessonId === l.id && a.completed).length })),
  };
}

export async function studentClasses(userId: string) {
  const student = await requireStudent(userId);
  const rows = await prisma.enrollment.findMany({
    where: { studentId: student.id, class: { status: "ACTIVE" } },
    orderBy: { startedAt: "asc" },
    select: { startedAt: true, class: { select: { id: true, name: true, status: true, lessonsPerCycle: true, course: { select: { name: true } }, teacher: { select: { position: true, user: { select: { name: true } } } } } } },
  });
  const classIds = rows.flatMap((r) => (r.class ? [r.class.id] : []));
  const [att, due] = await Promise.all([
    classIds.length ? prisma.attendance.findMany({ where: { studentId: student.id, completed: true, lesson: { classId: { in: classIds } } }, select: { lesson: { select: { classId: true } } } }) : [],
    classIds.length ? prisma.payment.findMany({ where: { studentId: student.id, classId: { in: classIds }, status: "DUE" }, select: { classId: true, cycle: true } }) : [],
  ]);
  return rows.flatMap((r) => {
    if (!r.class) return [];
    const c = r.class;
    const completed = att.filter((a) => a.lesson.classId === c.id).length;
    return [{
      id: c.id, name: c.name, courseName: c.course.name, status: c.status, teacherName: c.teacher.user.name, teacherPosition: c.teacher.position,
      joinedAt: r.startedAt.toISOString(), completedLessons: completed, progress: cycleProgress(completed, c.lessonsPerCycle), cycleSize: c.lessonsPerCycle,
      paymentDue: due.some((d) => d.classId === c.id),
    }];
  });
}
