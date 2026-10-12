// The school timetable: one place that creates, moves and cancels lessons, and the one place
// that refuses double-booking. Used by the admin schedule screen AND the teacher's own
// "Dərs əlavə et", so both obey the same rules.
//
// A lesson occupies [date, date + duration). Duration is the lesson's own `durationMinutes`
// or else the course's `lessonMinutes`. Two non-cancelled lessons may not overlap when they
// share the class, the teacher, or (when a room is set) the room.
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit, notifyParentsOfStudents, notifyStudents, notifyUsers } from "@/lib/events";
import { clock, dayMonth, fromBakuLocal, parts } from "@/features/parent-dashboard/az";

type Tx = Prisma.TransactionClient;
const localDate = z.string({ required_error: "Tarix və vaxt tələb olunur." }).regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Tarix düzgün deyil.");

export const lessonCreateInput = z.object({
  classId: z.string({ required_error: "Sinif seçin." }).min(1, "Sinif seçin."),
  date: localDate,
  durationMinutes: z.number().int().min(15, "Dərs ən az 15 dəqiqə olmalıdır.").max(240).nullable().optional(),
  room: z.string().trim().max(40).nullable().optional(),
});
export const lessonUpdateInput = z.object({
  date: localDate.optional(),
  durationMinutes: z.number().int().min(15).max(240).nullable().optional(),
  room: z.string().trim().max(40).nullable().optional(),
});

const hhmm = (d: Date) => clock(parts(d));
const when = (d: Date) => `${dayMonth(parts(d))}, ${hhmm(d)}`;


/** Serialises timetable changes of one teacher (and one room) so two simultaneous requests cannot both pass the clash check. */
async function lockTimetable(tx: Tx, teacherId: string, room?: string | null) {
  await tx.$queryRaw`SELECT "id" FROM "TeacherProfile" WHERE "id" = ${teacherId} FOR UPDATE`;
  const r = (room ?? "").trim().toLowerCase();
  if (r) await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"room:" + r}))::text AS "locked"`; // ::text — Prisma cannot read a void column
}

/** Throws a 409 naming the clashing lesson. */
export async function assertNoConflict(tx: Tx, a: { classId: string; start: Date; minutes?: number | null; room?: string | null; ignoreLessonId?: string }) {
  const cls = await tx.classGroup.findUnique({ where: { id: a.classId }, select: { teacherId: true, course: { select: { lessonMinutes: true } } } });
  if (!cls) throw new ApiError(404, MSG.notFound);
  const minutes = a.minutes ?? cls.course.lessonMinutes;
  const end = new Date(a.start.getTime() + minutes * 60_000);
  const room = (a.room ?? "").trim();
  const clashes = await tx.$queryRaw<{ id: string; classId: string; className: string; teacherId: string; room: string | null; date: Date }[]>`
    SELECT l."id", l."classId", c."name" AS "className", c."teacherId", l."room", l."date"
    FROM "Lesson" l
    JOIN "ClassGroup" c ON c."id" = l."classId"
    JOIN "Course" co ON co."id" = c."courseId"
    WHERE l."status" <> 'CANCELLED'
      AND l."id" <> ${a.ignoreLessonId ?? ""}
      AND l."date" < ${end}
      AND l."date" + make_interval(mins => COALESCE(l."durationMinutes", co."lessonMinutes")) > ${a.start}
      AND (c."teacherId" = ${cls.teacherId} OR l."classId" = ${a.classId} OR (${room} <> '' AND lower(l."room") = lower(${room})))
    ORDER BY l."date" LIMIT 1`;
  const c = clashes[0];
  if (!c) return;
  const msg =
    c.classId === a.classId
      ? `Bu sinfin həmin vaxt başqa dərsi var (${when(c.date)}).`
      : c.teacherId === cls.teacherId
        ? `Müəllim bu vaxt başqa dərsdədir: ${c.className}, ${when(c.date)}.`
        : `"${room}" otağı bu vaxt məşğuldur: ${c.className}, ${when(c.date)}.`;
  throw new ApiError(409, msg, { date: msg });
}

/** Creates a lesson for a class (caller has already authorised the actor). Same slot twice returns the existing lesson. */
export async function scheduleLesson(actorUserId: string, input: z.infer<typeof lessonCreateInput>) {
  const start = fromBakuLocal(input.date);
  return prisma.$transaction(async (tx) => {
    const cls = await tx.classGroup.findUniqueOrThrow({ where: { id: input.classId }, include: { course: true, enrollments: true, teacher: { select: { userId: true } } } });
    if (cls.status !== "ACTIVE") throw new ApiError(409, "Arxivlənmiş sinif üçün dərs planlaşdırmaq olmaz.");
    await lockTimetable(tx, cls.teacherId, input.room);
    const duplicate = await tx.lesson.findFirst({ where: { classId: cls.id, date: start, status: { not: "CANCELLED" } } });
    if (duplicate) return { id: duplicate.id, created: false as const };
    await assertNoConflict(tx, { classId: cls.id, start, minutes: input.durationMinutes, room: input.room });

    const lesson = await tx.lesson.create({
      data: { classId: cls.id, title: cls.course.name, description: "", date: start, durationMinutes: input.durationMinutes ?? null, room: input.room || null },
    });
    const studentIds = cls.enrollments.map((e) => e.studentId);
    const body = `${cls.course.name}: ${when(start)}${input.room ? ` · ${input.room}` : ""}.`;
    await notifyParentsOfStudents(tx, studentIds, { title: "Yeni dərs planlaşdırıldı", body, category: "lessons", event: "LESSON_SCHEDULED", entityType: "lesson", entityId: lesson.id });
    await notifyStudents(tx, studentIds, { title: "Yeni dərs planlaşdırıldı", body, event: "LESSON_SCHEDULED", entityType: "lesson", entityId: lesson.id });
    if (actorUserId !== cls.teacher.userId) await notifyUsers(tx, [cls.teacher.userId], { title: "Yeni dərs planlaşdırıldı", body: `${cls.name}: ${when(start)}.`, event: "LESSON_SCHEDULED", entityType: "lesson", entityId: lesson.id });
    await audit(tx, { actorUserId, action: "lesson.create", entityType: "lesson", entityId: lesson.id, after: { classId: cls.id, date: start.toISOString(), durationMinutes: input.durationMinutes ?? null, room: input.room || null } });
    return { id: lesson.id, created: true as const };
  });
}

export async function rescheduleLesson(actorUserId: string, lessonId: string, input: z.infer<typeof lessonUpdateInput>) {
  await prisma.$transaction(async (tx) => {
    const cur = await tx.lesson.findUnique({ where: { id: lessonId }, include: { class: { include: { enrollments: true, teacher: { select: { userId: true } } } } } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    if (cur.status === "CANCELLED" || cur.status === "COMPLETED") throw new ApiError(409, "Tamamlanmış və ya ləğv edilmiş dərs dəyişdirilə bilməz.");
    const start = input.date ? fromBakuLocal(input.date) : cur.date;
    const durationMinutes = input.durationMinutes === undefined ? cur.durationMinutes : input.durationMinutes;
    const room = input.room === undefined ? cur.room : input.room || null;
    await lockTimetable(tx, cur.class.teacherId, room);
    await assertNoConflict(tx, { classId: cur.classId, start, minutes: durationMinutes, room, ignoreLessonId: lessonId });
    await tx.lesson.update({ where: { id: lessonId }, data: { date: start, durationMinutes, room } });
    await audit(tx, { actorUserId, action: "lesson.reschedule", entityType: "lesson", entityId: lessonId, before: { date: cur.date.toISOString(), durationMinutes: cur.durationMinutes, room: cur.room }, after: { date: start.toISOString(), durationMinutes, room } });
    if (start.getTime() !== cur.date.getTime()) {
      const ids = cur.class.enrollments.map((e) => e.studentId);
      const body = `${cur.class.name}: ${when(cur.date)} → ${when(start)}.`;
      await notifyParentsOfStudents(tx, ids, { title: "Dərs vaxtı dəyişdi", body, type: "warning", category: "lessons", event: "LESSON_SCHEDULED", entityType: "lesson", entityId: lessonId });
      await notifyStudents(tx, ids, { title: "Dərs vaxtı dəyişdi", body, type: "warning", event: "LESSON_SCHEDULED", entityType: "lesson", entityId: lessonId });
      await notifyUsers(tx, [cur.class.teacher.userId], { title: "Dərs vaxtı dəyişdi", body, type: "warning", event: "LESSON_SCHEDULED", entityType: "lesson", entityId: lessonId });
    }
  });
  return getLesson(lessonId);
}

/** Cancels instead of deleting: the row stays for history, but it leaves every calendar. */
export async function cancelLesson(actorUserId: string, lessonId: string) {
  await prisma.$transaction(async (tx) => {
    const cur = await tx.lesson.findUnique({ where: { id: lessonId }, include: { class: { include: { enrollments: true, teacher: { select: { userId: true } } } } } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    if (cur.status === "CANCELLED") return;
    const completed = await tx.attendance.count({ where: { lessonId, completed: true } });
    if (cur.status === "COMPLETED" || completed > 0) throw new ApiError(409, "Tamamlanmış dərsi ləğv etmək olmaz.");
    await tx.lesson.update({ where: { id: lessonId }, data: { status: "CANCELLED" } });
    await audit(tx, { actorUserId, action: "lesson.cancel", entityType: "lesson", entityId: lessonId, before: { status: cur.status }, after: { status: "CANCELLED" } });
    const ids = cur.class.enrollments.map((e) => e.studentId);
    const body = `${cur.class.name}: ${when(cur.date)} tarixli dərs ləğv edildi.`;
    await notifyParentsOfStudents(tx, ids, { title: "Dərs ləğv edildi", body, type: "warning", category: "lessons", event: "LESSON_CANCELLED", entityType: "lesson", entityId: lessonId });
    await notifyStudents(tx, ids, { title: "Dərs ləğv edildi", body, type: "warning", event: "LESSON_CANCELLED", entityType: "lesson", entityId: lessonId });
    await notifyUsers(tx, [cur.class.teacher.userId], { title: "Dərs ləğv edildi", body, type: "warning", event: "LESSON_CANCELLED", entityType: "lesson", entityId: lessonId });
  });
  return getLesson(lessonId);
}

// ---------------------------------------------------------------- reads
const lessonSelect = {
  id: true, date: true, status: true, durationMinutes: true, room: true,
  class: { select: { id: true, name: true, teacher: { select: { id: true, user: { select: { name: true } } } }, course: { select: { name: true, lessonMinutes: true } } } },
  _count: { select: { attendance: true } },
} satisfies Prisma.LessonSelect;
type LessonRow = Prisma.LessonGetPayload<{ select: typeof lessonSelect }>;

/** SCHEDULED lessons that are running right now are shown as IN_PROGRESS (derived, never stored). */
export function effectiveStatus(l: { status: string; date: Date; minutes: number }, now = new Date()) {
  if (l.status === "SCHEDULED" && l.date <= now && now < new Date(l.date.getTime() + l.minutes * 60_000)) return "IN_PROGRESS";
  return l.status;
}

const present = (l: LessonRow, now = new Date()) => {
  const minutes = l.durationMinutes ?? l.class.course.lessonMinutes;
  return {
    id: l.id, date: l.date.toISOString(), endsAt: new Date(l.date.getTime() + minutes * 60_000).toISOString(), minutes,
    status: effectiveStatus({ status: l.status, date: l.date, minutes }, now), room: l.room,
    classId: l.class.id, className: l.class.name, courseName: l.class.course.name,
    teacherId: l.class.teacher.id, teacherName: l.class.teacher.user.name, attendanceRecords: l._count.attendance,
  };
};

export async function getLesson(id: string) {
  const l = await prisma.lesson.findUnique({ where: { id }, select: lessonSelect });
  if (!l) throw new ApiError(404, MSG.notFound);
  return present(l);
}

export async function listLessons(p: { from?: Date; to?: Date; classId?: string; teacherId?: string; status?: string; page: number; size: number }) {
  const where: Prisma.LessonWhereInput = {
    ...(p.from || p.to ? { date: { ...(p.from ? { gte: p.from } : {}), ...(p.to ? { lt: p.to } : {}) } } : {}),
    ...(p.classId ? { classId: p.classId } : {}),
    ...(p.teacherId ? { class: { teacherId: p.teacherId } } : {}),
    ...(p.status && ["SCHEDULED", "COMPLETED", "CANCELLED"].includes(p.status) ? { status: p.status as never } : {}), // unknown values (and IN_PROGRESS, which is derived) are ignored, never passed to the database
  };
  const [total, rows] = await Promise.all([
    prisma.lesson.count({ where }),
    prisma.lesson.findMany({ where, select: lessonSelect, orderBy: [{ date: "asc" }, { id: "asc" }], skip: (p.page - 1) * p.size, take: p.size }),
  ]);
  const now = new Date();
  return { total, items: rows.map((r) => present(r, now)) };
}
