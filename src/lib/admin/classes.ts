// Admin class management: the database is the single source of truth. Every mutation runs in
// ONE transaction together with its audit entry and notifications, then the dashboards of
// every role are revalidated by the route that called it.
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit, notifyParentsOfStudentsDirect, notifyStudents, notifyUsers } from "@/lib/events";
import { cycleProgress } from "@/lib/billing";
import { getSettings } from "@/lib/settings";

type Tx = Prisma.TransactionClient;

export const classCreateSchema = z.object({
  name: z.string({ required_error: "Sinif adı tələb olunur." }).trim().min(2, "Sinif adı ən az 2 simvol olmalıdır.").max(80, "Sinif adı çox uzundur."),
  courseId: z.string({ required_error: "Kurs seçin." }).min(1, "Kurs seçin."),
  teacherId: z.string({ required_error: "Müəllim seçin." }).min(1, "Müəllim seçin."),
  studentIds: z.array(z.string().min(1)).max(300).default([]),
  schedule: z.string().trim().max(80).optional(),
  lessonsPerCycle: z.number().int().min(1).max(40).optional(),
  capacity: z.number().int().min(1).max(500).nullable().optional(),
});

export const classUpdateSchema = z.object({
  name: z.string().trim().min(2, "Sinif adı ən az 2 simvol olmalıdır.").max(80).optional(),
  schedule: z.string().trim().max(80).optional(),
  lessonsPerCycle: z.number().int().min(1).max(40).optional(),
  capacity: z.number().int().min(1).max(500).nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

// ------------------------------------------------------------------ lookups
async function requireTeacherProfile(tx: Tx, teacherId: string) {
  // only accounts that really are active teachers can be assigned
  const t = await tx.teacherProfile.findFirst({ where: { id: teacherId, user: { role: "TEACHER", active: true } }, select: { id: true, userId: true, user: { select: { name: true } } } });
  if (!t) throw new ApiError(404, MSG.teacherNotFound, { teacherId: MSG.teacherNotFound });
  return t;
}

export async function requireStudents(tx: Tx, studentIds: string[]) {
  const ids = [...new Set(studentIds)];
  const rows = await tx.studentProfile.findMany({ where: { id: { in: ids }, active: true }, select: { id: true, firstName: true, lastName: true } });
  if (rows.length !== ids.length) {
    const found = new Set(rows.map((r) => r.id));
    throw new ApiError(404, MSG.studentNotFound, { studentIds: `${MSG.studentNotFound} (${ids.filter((i) => !found.has(i)).length})` });
  }
  return rows;
}

/** Enrols students in a class (creating the membership or attaching a class-less enrolment of the same course). Returns the ids that were newly added. */
export async function enrol(tx: Tx, classId: string, courseId: string, studentIds: string[]) {
  const existing = await tx.enrollment.findMany({ where: { studentId: { in: studentIds }, OR: [{ classId }, { courseId, classId: null }] }, select: { id: true, studentId: true, classId: true } });
  const already = new Set(existing.filter((e) => e.classId === classId).map((e) => e.studentId));
  const attach = existing.filter((e) => e.classId === null);
  const added: string[] = [];
  for (const studentId of studentIds) {
    if (already.has(studentId)) continue;
    const orphan = attach.find((e) => e.studentId === studentId);
    if (orphan) await tx.enrollment.update({ where: { id: orphan.id }, data: { classId, status: "active" } });
    else await tx.enrollment.create({ data: { studentId, courseId, classId, status: "active" } });
    added.push(studentId);
  }
  return { added, already: [...already] };
}

// ------------------------------------------------------------------ listing
export type ClassListParams = { q?: string; status?: "ACTIVE" | "ARCHIVED" | "ALL"; teacherId?: string; sort?: "name" | "created" | "students"; dir?: "asc" | "desc"; page: number; size: number };

export async function listClasses(p: ClassListParams) {
  const where: Prisma.ClassGroupWhereInput = {
    ...(p.status && p.status !== "ALL" ? { status: p.status } : {}),
    ...(p.teacherId ? { teacherId: p.teacherId } : {}),
    ...(p.q ? { OR: [{ name: { contains: p.q, mode: "insensitive" } }, { course: { name: { contains: p.q, mode: "insensitive" } } }, { teacher: { user: { name: { contains: p.q, mode: "insensitive" } } } }] } : {}),
  };
  const dir = p.dir ?? "asc";
  const orderBy: Prisma.ClassGroupOrderByWithRelationInput =
    p.sort === "created" ? { createdAt: dir } : p.sort === "students" ? { enrollments: { _count: dir } } : { name: dir };

  const [total, rows] = await Promise.all([
    prisma.classGroup.count({ where }),
    prisma.classGroup.findMany({
      where,
      orderBy: [orderBy, { id: "asc" }],
      skip: (p.page - 1) * p.size,
      take: p.size,
      select: {
        id: true, name: true, status: true, schedule: true, createdAt: true, lessonsPerCycle: true,
        course: { select: { id: true, name: true } },
        teacher: { select: { id: true, user: { select: { name: true } } } },
        _count: { select: { enrollments: true, lessons: true } },
      },
    }),
  ]);

  // two grouped queries for the whole page — no per-row queries
  const ids = rows.map((r) => r.id);
  const [completed, due] = await Promise.all([
    ids.length
      ? prisma.$queryRaw<{ classId: string; n: bigint }[]>`SELECT l."classId" AS "classId", count(*) AS n FROM "Attendance" a JOIN "Lesson" l ON l."id" = a."lessonId" WHERE a."completed" AND l."classId" = ANY(${ids}) GROUP BY l."classId"`
      : [],
    ids.length ? prisma.payment.groupBy({ by: ["classId"], where: { classId: { in: ids }, status: "DUE" }, _count: { _all: true } }) : [],
  ]);
  const completedBy = new Map(completed.map((c) => [c.classId, Number(c.n)]));
  const dueBy = new Map(due.map((d) => [d.classId as string, d._count._all]));

  return {
    total,
    items: rows.map((r) => ({
      id: r.id, name: r.name, status: r.status, schedule: r.schedule, createdAt: r.createdAt.toISOString(),
      courseId: r.course.id, courseName: r.course.name,
      teacherId: r.teacher.id, teacherName: r.teacher.user.name,
      students: r._count.enrollments, lessons: r._count.lessons,
      completedLessons: completedBy.get(r.id) ?? 0,
      paymentsDue: dueBy.get(r.id) ?? 0,
    })),
  };
}

// ------------------------------------------------------------------ details
export async function getClassDetail(id: string) {
  const cls = await prisma.classGroup.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, name: true, price: true } },
      teacher: { select: { id: true, position: true, user: { select: { name: true, email: true } } } },
      enrollments: { orderBy: { startedAt: "asc" }, include: { student: { select: { id: true, firstName: true, lastName: true, grade: true, active: true, user: { select: { email: true } } } } } },
      _count: { select: { lessons: true } },
    },
  });
  if (!cls) throw new ApiError(404, MSG.notFound);

  const studentIds = cls.enrollments.map((e) => e.studentId);
  const [att, payments] = await Promise.all([
    studentIds.length ? prisma.attendance.findMany({ where: { studentId: { in: studentIds }, lesson: { classId: id } }, select: { studentId: true, completed: true, status: true } }) : [],
    prisma.payment.findMany({ where: { classId: id }, orderBy: { cycle: "desc" }, select: { id: true, studentId: true, cycle: true, status: true, amount: true, dueDate: true, paidAt: true } }),
  ]);

  const students = cls.enrollments.map((e) => {
    const mine = att.filter((a) => a.studentId === e.studentId);
    const completed = mine.filter((a) => a.completed).length;
    const pays = payments.filter((p) => p.studentId === e.studentId);
    const open = pays.find((p) => p.status === "DUE");
    const latest = open ?? pays[0] ?? null;
    return {
      studentId: e.studentId,
      name: `${e.student.firstName} ${e.student.lastName}`,
      grade: e.student.grade,
      email: e.student.user?.email ?? null,
      active: e.student.active,
      joinedAt: e.startedAt.toISOString(),
      recorded: mine.length,
      completedLessons: completed,
      progress: cycleProgress(completed, cls.lessonsPerCycle),
      payment: latest ? { id: latest.id, status: latest.status, cycle: latest.cycle } : null,
    };
  });

  return {
    id: cls.id, name: cls.name, status: cls.status, schedule: cls.schedule, lessonsPerCycle: cls.lessonsPerCycle, capacity: cls.capacity,
    createdAt: cls.createdAt.toISOString(), archivedAt: cls.archivedAt?.toISOString() ?? null,
    course: { id: cls.course.id, name: cls.course.name, price: cls.course.price },
    teacher: { id: cls.teacher.id, name: cls.teacher.user.name, email: cls.teacher.user.email, position: cls.teacher.position },
    metrics: {
      students: students.length,
      lessons: cls._count.lessons,
      completedLessons: students.reduce((n, s) => n + s.completedLessons, 0),
      paymentsDue: payments.filter((p) => p.status === "DUE").length,
    },
    students,
  };
}

// ------------------------------------------------------------------ mutations
export async function createClass(actorUserId: string, input: z.infer<typeof classCreateSchema>) {
  const settings = await getSettings();
  const id = await prisma.$transaction(async (tx) => {
    const teacher = await requireTeacherProfile(tx, input.teacherId);
    const course = await tx.course.findFirst({ where: { id: input.courseId, active: true }, select: { id: true, name: true } });
    if (!course) throw new ApiError(404, "Kurs tapılmadı.", { courseId: "Kurs tapılmadı." });
    const students = await requireStudents(tx, input.studentIds);
    const capacity = input.capacity === undefined ? settings["class.defaultCapacity"] || null : input.capacity;
    if (capacity && students.length > capacity) throw new ApiError(409, `Sinfin tutumu ${capacity} tələbədir.`, { studentIds: `Sinfin tutumu ${capacity} tələbədir.` });

    const cls = await tx.classGroup.create({
      data: { name: input.name, courseId: course.id, teacherId: teacher.id, schedule: input.schedule || "Cədvəl təyin edilməyib", lessonsPerCycle: input.lessonsPerCycle ?? settings["billing.lessonsPerCycle"], capacity },
    });
    const { added } = await enrol(tx, cls.id, course.id, students.map((s) => s.id));

    await audit(tx, { actorUserId, action: "class.create", entityType: "class", entityId: cls.id, after: { name: cls.name, courseId: course.id, teacherId: teacher.id, studentIds: added } });
    const ref = { entityType: "class" as const, entityId: cls.id };
    await notifyUsers(tx, [teacher.userId], { title: "Yeni sinif təyin edildi", body: `"${cls.name}" sinfi sizə təyin edildi (${added.length} tələbə).`, type: "info", event: "TEACHER_ASSIGNED", ...ref });
    await notifyStudents(tx, added, { title: "Yeni sinfə əlavə olundun", body: `"${cls.name}" sinfinə əlavə edildin. Müəllim: ${teacher.user.name}.`, type: "success", event: "CLASS_ASSIGNED", ...ref });
    await notifyParentsOfStudentsDirect(tx, added, { title: "Sinfə əlavə olundu", body: `Övladınız "${cls.name}" sinfinə əlavə edildi. Müəllim: ${teacher.user.name}.`, type: "info", event: "CLASS_ASSIGNED", ...ref });
    return cls.id;
  });
  return getClassDetail(id);
}

export async function updateClass(actorUserId: string, id: string, input: z.infer<typeof classUpdateSchema>) {
  await prisma.$transaction(async (tx) => {
    const before = await tx.classGroup.findUnique({ where: { id } });
    if (!before) throw new ApiError(404, MSG.notFound);
    const data: Prisma.ClassGroupUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.schedule !== undefined) data.schedule = input.schedule || "Cədvəl təyin edilməyib";
    if (input.lessonsPerCycle !== undefined) data.lessonsPerCycle = input.lessonsPerCycle;
    if (input.capacity !== undefined) {
      if (input.capacity !== null) {
        const members = await tx.enrollment.count({ where: { classId: id } });
        if (input.capacity < members) throw new ApiError(409, `Sinifdə artıq ${members} tələbə var; tutum bundan az ola bilməz.`, { capacity: `Sinifdə artıq ${members} tələbə var.` });
      }
      data.capacity = input.capacity;
    }
    if (input.status && input.status !== before.status) {
      data.status = input.status;
      data.archivedAt = input.status === "ARCHIVED" ? new Date() : null;
    }
    if (!Object.keys(data).length) return;
    const after = await tx.classGroup.update({ where: { id }, data });
    const archivedNow = input.status === "ARCHIVED" && before.status !== "ARCHIVED";
    const restored = input.status === "ACTIVE" && before.status === "ARCHIVED";
    await audit(tx, {
      actorUserId,
      action: archivedNow ? "class.archive" : restored ? "class.restore" : "class.update",
      entityType: "class",
      entityId: id,
      before: { name: before.name, schedule: before.schedule, status: before.status, lessonsPerCycle: before.lessonsPerCycle },
      after: { name: after.name, schedule: after.schedule, status: after.status, lessonsPerCycle: after.lessonsPerCycle },
    });
    if (archivedNow || restored) {
      const t = await tx.teacherProfile.findUnique({ where: { id: after.teacherId }, select: { userId: true } });
      if (t) await notifyUsers(tx, [t.userId], { title: archivedNow ? "Sinif arxivləndi" : "Sinif bərpa olundu", body: `"${after.name}" sinfi ${archivedNow ? "arxivə göndərildi" : "yenidən aktivdir"}.`, type: "info", entityType: "class", entityId: id });
    }
  });
  return getClassDetail(id);
}

/** DELETE semantics: a class with no lessons and no payments is removed; anything with history is archived instead. */
export async function deleteOrArchiveClass(actorUserId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const cls = await tx.classGroup.findUnique({ where: { id }, include: { _count: { select: { lessons: true, payments: true } } } });
    if (!cls) throw new ApiError(404, MSG.notFound);
    if (cls._count.lessons === 0 && cls._count.payments === 0) {
      await audit(tx, { actorUserId, action: "class.delete", entityType: "class", entityId: id, before: { name: cls.name, teacherId: cls.teacherId } });
      await tx.enrollment.deleteMany({ where: { classId: id } });
      await tx.classGroup.delete({ where: { id } });
      return { deleted: true as const, archived: false as const };
    }
    if (cls.status !== "ARCHIVED") {
      await tx.classGroup.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
      await audit(tx, { actorUserId, action: "class.archive", entityType: "class", entityId: id, before: { status: cls.status }, after: { status: "ARCHIVED" } });
    }
    return { deleted: false as const, archived: true as const };
  });
}

export async function setClassTeacher(actorUserId: string, id: string, teacherId: string) {
  await prisma.$transaction(async (tx) => {
    const cls = await tx.classGroup.findUnique({ where: { id }, include: { teacher: { select: { userId: true, user: { select: { name: true } } } }, enrollments: { select: { studentId: true } } } });
    if (!cls) throw new ApiError(404, MSG.notFound);
    const teacher = await requireTeacherProfile(tx, teacherId);
    if (cls.teacherId === teacher.id) return;
    await tx.classGroup.update({ where: { id }, data: { teacherId: teacher.id } });
    await audit(tx, { actorUserId, action: "class.teacher.change", entityType: "class", entityId: id, before: { teacherId: cls.teacherId }, after: { teacherId: teacher.id } });
    const ref = { entityType: "class" as const, entityId: id };
    await notifyUsers(tx, [cls.teacher.userId], { title: "Sinif sizdən götürüldü", body: `"${cls.name}" sinfi artıq sizə aid deyil.`, type: "warning", event: "TEACHER_ASSIGNED", ...ref });
    await notifyUsers(tx, [teacher.userId], { title: "Yeni sinif təyin edildi", body: `"${cls.name}" sinfi sizə təyin edildi (${cls.enrollments.length} tələbə).`, type: "info", event: "TEACHER_ASSIGNED", ...ref });
    const ids = cls.enrollments.map((e) => e.studentId);
    await notifyStudents(tx, ids, { title: "Müəllim dəyişdi", body: `"${cls.name}" sinfinin yeni müəllimi: ${teacher.user.name}.`, type: "info", event: "TEACHER_ASSIGNED", ...ref });
  });
  return getClassDetail(id);
}

export async function addClassStudents(actorUserId: string, id: string, studentIds: string[]) {
  const result = await prisma.$transaction((tx) => addStudentsToClassTx(tx, actorUserId, id, studentIds));
  return { ...result, class: await getClassDetail(id) };
}

/** Adds students inside the caller's transaction (capacity, duplicates, archived classes enforced; audit + notices included). */
export async function addStudentsToClassTx(tx: Tx, actorUserId: string, id: string, studentIds: string[]) {
  await tx.$queryRaw`SELECT "id" FROM "ClassGroup" WHERE "id" = ${id} FOR UPDATE`; // capacity is checked against a stable member count
  const cls = await tx.classGroup.findUnique({ where: { id }, select: { id: true, name: true, courseId: true, status: true, teacher: { select: { user: { select: { name: true } } } } } });
  if (!cls) throw new ApiError(404, MSG.notFound);
  if (cls.status === "ARCHIVED") throw new ApiError(409, "Arxivlənmiş sinfə tələbə əlavə etmək olmaz.");
  const students = await requireStudents(tx, studentIds);
  const { added, already } = await enrol(tx, id, cls.courseId, students.map((s) => s.id));
  if (!added.length) throw new ApiError(409, MSG.alreadyMember, { studentIds: MSG.alreadyMember });
  const cap = await tx.classGroup.findUniqueOrThrow({ where: { id }, select: { capacity: true, _count: { select: { enrollments: true } } } });
  if (cap.capacity && cap._count.enrollments > cap.capacity) throw new ApiError(409, `Sinfin tutumu ${cap.capacity} tələbədir; yer çatmır.`, { studentIds: `Sinfin tutumu ${cap.capacity} tələbədir.` }); // rolls the whole transaction back
  await audit(tx, { actorUserId, action: "class.student.add", entityType: "class", entityId: id, after: { studentIds: added } });
  const ref = { entityType: "class" as const, entityId: id };
  await notifyStudents(tx, added, { title: "Yeni sinfə əlavə olundun", body: `"${cls.name}" sinfinə əlavə edildin. Müəllim: ${cls.teacher.user.name}.`, type: "success", event: "CLASS_ASSIGNED", ...ref });
  await notifyParentsOfStudentsDirect(tx, added, { title: "Sinfə əlavə olundu", body: `Övladınız "${cls.name}" sinfinə əlavə edildi.`, type: "info", event: "CLASS_ASSIGNED", ...ref });
  return { added, already };
}

/** Removes the membership only — the student account, lessons and payments stay. */
export async function removeClassStudent(actorUserId: string, id: string, studentId: string) {
  await prisma.$transaction(async (tx) => {
    const cls = await tx.classGroup.findUnique({ where: { id }, select: { name: true } });
    if (!cls) throw new ApiError(404, MSG.notFound);
    const { count } = await tx.enrollment.deleteMany({ where: { classId: id, studentId } });
    if (!count) throw new ApiError(404, "Tələbə bu sinifdə deyil.");
    await audit(tx, { actorUserId, action: "class.student.remove", entityType: "class", entityId: id, before: { studentId } });
    await notifyStudents(tx, [studentId], { title: "Sinifdən çıxarıldın", body: `"${cls.name}" sinfinin üzvü deyilsən.`, type: "warning", entityType: "class", entityId: id });
  });
  return getClassDetail(id);
}

// ------------------------------------------------------------------ pickers
export async function searchTeachers(q: string, limit = 10) {
  const rows = await prisma.teacherProfile.findMany({
    where: {
      user: { role: "TEACHER", active: true },
      ...(q ? { OR: [{ user: { name: { contains: q, mode: "insensitive" } } }, { user: { email: { contains: q, mode: "insensitive" } } }, { position: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { user: { name: "asc" } },
    take: Math.min(limit, 50),
    select: { id: true, position: true, user: { select: { name: true, email: true } }, _count: { select: { classes: { where: { status: "ACTIVE" } } } } },
  });
  return rows.map((t) => ({ id: t.id, name: t.user.name, email: t.user.email, position: t.position, classes: t._count.classes }));
}

export async function listCourses() {
  return prisma.course.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, price: true } });
}
