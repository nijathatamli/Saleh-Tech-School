// Admin-side teacher accounts: User (role TEACHER, bcrypt) + TeacherProfile. Deactivating keeps every
// class, lesson and note; it just stops sign-in and removes the teacher from the class pickers.
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit } from "@/lib/events";

const nameField = z.string({ required_error: "Ad tələb olunur." }).trim().min(3, "Ad ən az 3 simvol olmalıdır.").max(80, "Ad çox uzundur.");
const emailField = z.string({ required_error: "E-poçt tələb olunur." }).trim().toLowerCase().email("E-poçt ünvanı düzgün deyil.").max(120);
const passwordField = z.string({ required_error: "Şifrə tələb olunur." }).min(8, "Şifrə ən az 8 simvol olmalıdır.").max(72, "Şifrə çox uzundur.");
const tags = z.array(z.string().trim().min(1).max(40)).max(12).default([]);

export const teacherCreateSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  phone: z.string().trim().max(30).optional(),
  position: z.string({ required_error: "Vəzifə tələb olunur." }).trim().min(2, "Vəzifə tələb olunur.").max(80),
  bio: z.string().trim().max(2000).default(""),
  experienceYears: z.number().int().min(0).max(60).default(0),
  specializations: tags,
});

export const teacherUpdateSchema = z.object({
  name: nameField.optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  position: z.string().trim().min(2).max(80).optional(),
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  specializations: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
  active: z.boolean().optional(),
  password: passwordField.optional(),
});

export async function createTeacher(actorUserId: string, input: z.infer<typeof teacherCreateSchema>) {
  const id = await prisma.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email: input.email }, select: { id: true } })) throw new ApiError(409, "Bu e-poçt artıq istifadə olunur.", { email: "Bu e-poçt artıq istifadə olunur." });
    const user = await tx.user.create({
      data: {
        name: input.name, email: input.email, phone: input.phone || null, passwordHash: await bcrypt.hash(input.password, 10), role: "TEACHER",
        teacherProfile: { create: { position: input.position, bio: input.bio, experienceYears: input.experienceYears, specializations: input.specializations } },
      },
      include: { teacherProfile: true },
    });
    await audit(tx, { actorUserId, action: "teacher.create", entityType: "teacher", entityId: user.teacherProfile!.id, after: { userId: user.id, email: user.email, position: input.position } });
    return user.teacherProfile!.id;
  });
  return getTeacher(id);
}

export async function updateTeacher(actorUserId: string, id: string, input: z.infer<typeof teacherUpdateSchema>) {
  await prisma.$transaction(async (tx) => {
    const cur = await tx.teacherProfile.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, active: true, phone: true } } } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    if (input.active === false && cur.user.active) {
      const open = await tx.classGroup.count({ where: { teacherId: id, status: "ACTIVE" } });
      if (open) throw new ApiError(409, `Müəllimin ${open} aktiv sinfi var. Əvvəlcə sinifləri başqa müəllimə verin.`, { active: `Müəllimin ${open} aktiv sinfi var.` });
    }
    const p: Prisma.TeacherProfileUpdateInput = {};
    if (input.position !== undefined) p.position = input.position;
    if (input.bio !== undefined) p.bio = input.bio;
    if (input.experienceYears !== undefined) p.experienceYears = input.experienceYears;
    if (input.specializations !== undefined) p.specializations = input.specializations;
    if (Object.keys(p).length) await tx.teacherProfile.update({ where: { id }, data: p });
    const u: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) u.name = input.name;
    if (input.phone !== undefined) u.phone = input.phone || null;
    if (input.active !== undefined) u.active = input.active;
    if (input.password) u.passwordHash = await bcrypt.hash(input.password, 10);
    if (Object.keys(u).length) await tx.user.update({ where: { id: cur.user.id }, data: u });
    await audit(tx, {
      actorUserId, action: input.active !== undefined && input.active !== cur.user.active ? (input.active ? "teacher.activate" : "teacher.deactivate") : "teacher.update", entityType: "teacher", entityId: id,
      before: { name: cur.user.name, position: cur.position, active: cur.user.active },
      after: { name: input.name, position: input.position, active: input.active, passwordChanged: !!input.password },
    });
  });
  return getTeacher(id);
}

const teacherRow = {
  id: true, position: true, experienceYears: true, specializations: true,
  user: { select: { id: true, name: true, email: true, phone: true, active: true } },
} satisfies Prisma.TeacherProfileSelect;

/** Workload = students in active classes + lessons/hours in the next 7 days; computed with grouped queries for the whole page. */
async function workload(ids: string[]) {
  if (!ids.length) return new Map<string, { classes: number; students: number; lessonsWeek: number; hoursWeek: number; lessonsMonth: number }>();
  const now = new Date();
  const week = new Date(now.getTime() + 7 * 86_400_000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const [classes, students, lessons] = await Promise.all([
    prisma.classGroup.groupBy({ by: ["teacherId"], where: { teacherId: { in: ids }, status: "ACTIVE" }, _count: { _all: true } }),
    prisma.$queryRaw<{ teacherId: string; n: bigint }[]>`SELECT c."teacherId", count(DISTINCT e."studentId") AS n FROM "Enrollment" e JOIN "ClassGroup" c ON c."id" = e."classId" WHERE c."status" = 'ACTIVE' AND c."teacherId" = ANY(${ids}) GROUP BY c."teacherId"`,
    prisma.$queryRaw<{ teacherId: string; wk: bigint; mins: bigint | null; mo: bigint }[]>`
      SELECT c."teacherId",
             count(*) FILTER (WHERE l."date" >= ${now} AND l."date" < ${week}) AS wk,
             sum(COALESCE(l."durationMinutes", co."lessonMinutes")) FILTER (WHERE l."date" >= ${now} AND l."date" < ${week}) AS mins,
             count(*) FILTER (WHERE l."date" >= ${monthStart} AND l."date" < ${monthEnd}) AS mo
      FROM "Lesson" l JOIN "ClassGroup" c ON c."id" = l."classId" JOIN "Course" co ON co."id" = c."courseId"
      WHERE l."status" <> 'CANCELLED' AND c."teacherId" = ANY(${ids}) GROUP BY c."teacherId"`,
  ]);
  const out = new Map<string, { classes: number; students: number; lessonsWeek: number; hoursWeek: number; lessonsMonth: number }>();
  for (const id of ids) out.set(id, { classes: 0, students: 0, lessonsWeek: 0, hoursWeek: 0, lessonsMonth: 0 });
  for (const c of classes) out.get(c.teacherId)!.classes = c._count._all;
  for (const s of students) out.get(s.teacherId)!.students = Number(s.n);
  for (const l of lessons) Object.assign(out.get(l.teacherId)!, { lessonsWeek: Number(l.wk), hoursWeek: Math.round((Number(l.mins ?? 0) / 60) * 10) / 10, lessonsMonth: Number(l.mo) });
  return out;
}

export async function listTeachers(p: { q?: string; active?: boolean; page: number; size: number }) {
  const where: Prisma.TeacherProfileWhereInput = {
    ...(p.active !== undefined ? { user: { active: p.active } } : {}),
    ...(p.q ? { OR: [{ user: { name: { contains: p.q, mode: "insensitive" } } }, { user: { email: { contains: p.q, mode: "insensitive" } } }, { position: { contains: p.q, mode: "insensitive" } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.teacherProfile.count({ where }),
    prisma.teacherProfile.findMany({ where, select: teacherRow, orderBy: [{ user: { name: "asc" } }, { id: "asc" }], skip: (p.page - 1) * p.size, take: p.size }),
  ]);
  const w = await workload(rows.map((r) => r.id));
  return { total, items: rows.map((r) => ({ id: r.id, userId: r.user.id, name: r.user.name, email: r.user.email, phone: r.user.phone, active: r.user.active, position: r.position, experienceYears: r.experienceYears, specializations: r.specializations, ...w.get(r.id)! })) };
}

export async function getTeacher(id: string) {
  const t = await prisma.teacherProfile.findUnique({
    where: { id },
    select: { ...teacherRow, bio: true, classes: { orderBy: { name: "asc" }, select: { id: true, name: true, status: true, schedule: true, course: { select: { name: true } }, _count: { select: { enrollments: true, lessons: true } } } } },
  });
  if (!t) throw new ApiError(404, MSG.notFound);
  const w = (await workload([id])).get(id)!;
  const upcoming = await prisma.lesson.findMany({
    where: { class: { teacherId: id }, status: { not: "CANCELLED" }, date: { gte: new Date(), lt: new Date(Date.now() + 14 * 86_400_000) } },
    orderBy: { date: "asc" }, take: 30,
    select: { id: true, date: true, room: true, durationMinutes: true, class: { select: { id: true, name: true, course: { select: { lessonMinutes: true } } } } },
  });
  return {
    id: t.id, userId: t.user.id, name: t.user.name, email: t.user.email, phone: t.user.phone, active: t.user.active,
    position: t.position, bio: t.bio, experienceYears: t.experienceYears, specializations: t.specializations,
    workload: w,
    classes: t.classes.map((c) => ({ id: c.id, name: c.name, status: c.status, schedule: c.schedule, courseName: c.course.name, students: c._count.enrollments, lessons: c._count.lessons })),
    schedule: upcoming.map((l) => ({ id: l.id, date: l.date.toISOString(), room: l.room, minutes: l.durationMinutes ?? l.class.course.lessonMinutes, classId: l.class.id, className: l.class.name })),
  };
}
