// Admin-side student accounts: creation (User + StudentProfile through the app's own auth
// model — role STUDENT, bcrypt hash), server-side search for the class pickers, listing.
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit, notifyAdmins } from "@/lib/events";
import { decryptFin, encryptFin, hashFin } from "@/lib/scholarship/security";
import { normalizeFin } from "@/lib/scholarship/validation";

const nameField = (label: string) =>
  z.string({ required_error: `${label} tələb olunur.` }).trim().min(2, `${label} ən az 2 hərf olmalıdır.`).max(40, `${label} çox uzundur.`).regex(/^[\p{L}][\p{L}'’ .-]*$/u, `${label} yalnız hərflərdən ibarət olmalıdır.`);
const emailField = z.string({ required_error: "E-poçt tələb olunur." }).trim().toLowerCase().email("E-poçt ünvanı düzgün deyil.").max(120);
const passwordField = z.string({ required_error: "Şifrə tələb olunur." }).min(8, "Şifrə ən az 8 simvol olmalıdır.").max(72, "Şifrə çox uzundur.");
const finField = z.string().transform(normalizeFin).refine((v) => v === "" || /^[A-Z0-9]{7}$/.test(v), "FIN 7 simvoldan ibarət olmalıdır (böyük latın hərfləri və rəqəmlər).");
const dateField = z.string({ required_error: "Doğum tarixi tələb olunur." }).regex(/^\d{4}-\d{2}-\d{2}$/, "Doğum tarixi düzgün deyil.").refine((v) => !Number.isNaN(Date.parse(v)) && new Date(v) < new Date(), "Doğum tarixi düzgün deyil.");

export const studentCreateSchema = z
  .object({
    firstName: nameField("Ad"),
    lastName: nameField("Soyad"),
    email: emailField,
    password: passwordField,
    birthDate: dateField,
    grade: z.number().int().min(1, "Sinif 1-11 arasında olmalıdır.").max(11, "Sinif 1-11 arasında olmalıdır.").optional(),
    fin: finField.optional(),
    active: z.boolean().default(true),
    parentId: z.string().min(1).optional(),
    newParent: z.object({ name: nameField("Valideynin adı"), email: emailField, phone: z.string().trim().max(30).optional(), password: passwordField }).optional(),
  })
  .refine((v) => v.parentId || v.newParent, { path: ["parentId"], message: "Valideyn seçin və ya yeni valideyn yaradın." });

export const studentUpdateSchema = z.object({
  firstName: nameField("Ad").optional(),
  lastName: nameField("Soyad").optional(),
  birthDate: dateField.optional(),
  grade: z.number().int().min(1).max(11).nullable().optional(),
  fin: finField.optional(),
  active: z.boolean().optional(),
  password: passwordField.optional(),
});

export async function createStudent(actorUserId: string, input: z.infer<typeof studentCreateSchema>) {
  const result = await prisma.$transaction((tx) => createStudentTx(tx, actorUserId, input));
  return getStudent(result);
}

/** The whole creation (parent, login, profile, audit) inside the caller's transaction — admissions reuses it so nothing is half-created. */
export async function createStudentTx(tx: Prisma.TransactionClient, actorUserId: string, input: z.infer<typeof studentCreateSchema>) {
  const finNorm = input.fin || null;
  const finHash = finNorm ? hashFin(finNorm) : null;
  {
    if (await tx.user.findUnique({ where: { email: input.email }, select: { id: true } })) throw new ApiError(409, "Bu e-poçt artıq istifadə olunur.", { email: "Bu e-poçt artıq istifadə olunur." });
    if (finHash && (await tx.studentProfile.findUnique({ where: { finHash }, select: { id: true } }))) throw new ApiError(409, "Bu FIN artıq qeydiyyatdan keçib.", { fin: "Bu FIN artıq qeydiyyatdan keçib." });

    let parentProfileId = input.parentId;
    if (parentProfileId) {
      if (!(await tx.parentProfile.findFirst({ where: { id: parentProfileId, user: { active: true } }, select: { id: true } }))) throw new ApiError(404, "Valideyn tapılmadı.", { parentId: "Valideyn tapılmadı." });
    } else if (input.newParent) {
      const np = input.newParent;
      if (await tx.user.findUnique({ where: { email: np.email }, select: { id: true } })) throw new ApiError(409, "Valideynin e-poçtu artıq istifadə olunur.", { newParent: "Valideynin e-poçtu artıq istifadə olunur." });
      const pu = await tx.user.create({ data: { name: np.name, email: np.email, phone: np.phone || null, passwordHash: await bcrypt.hash(np.password, 10), role: "PARENT", parentProfile: { create: {} } }, include: { parentProfile: true } });
      parentProfileId = pu.parentProfile!.id;
      await audit(tx, { actorUserId, action: "user.create", entityType: "user", entityId: pu.id, after: { role: "PARENT", email: np.email } });
    }

    const user = await tx.user.create({
      data: { name: `${input.firstName} ${input.lastName}`, email: input.email, passwordHash: await bcrypt.hash(input.password, 10), role: "STUDENT", active: input.active },
    });
    const student = await tx.studentProfile.create({
      data: {
        userId: user.id,
        parentId: parentProfileId!,
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate: new Date(input.birthDate),
        grade: input.grade ?? null,
        active: input.active,
        ...(finNorm ? { finHash, finEncrypted: encryptFin(finNorm) } : {}),
      },
    });
    // never put the password or FIN into the audit trail
    await audit(tx, { actorUserId, action: "student.create", entityType: "student", entityId: student.id, after: { userId: user.id, email: user.email, grade: input.grade ?? null, parentId: parentProfileId, active: input.active } });
    await notifyAdmins(tx, { title: "Yeni tələbə", body: `${input.firstName} ${input.lastName} sistemə əlavə edildi.`, type: "info", event: "NEW_STUDENT", entityType: "student", entityId: student.id, exceptUserId: actorUserId });
    return student.id;
  }
}

export async function updateStudent(actorUserId: string, id: string, input: z.infer<typeof studentUpdateSchema>) {
  await prisma.$transaction(async (tx) => {
    const cur = await tx.studentProfile.findUnique({ where: { id } });
    if (!cur) throw new ApiError(404, MSG.studentNotFound);
    const data: Prisma.StudentProfileUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.birthDate !== undefined) data.birthDate = new Date(input.birthDate);
    if (input.grade !== undefined) data.grade = input.grade;
    if (input.active !== undefined) data.active = input.active;
    if (input.fin) {
      const h = hashFin(input.fin);
      const clash = await tx.studentProfile.findUnique({ where: { finHash: h }, select: { id: true } });
      if (clash && clash.id !== id) throw new ApiError(409, "Bu FIN artıq qeydiyyatdan keçib.", { fin: "Bu FIN artıq qeydiyyatdan keçib." });
      data.finHash = h;
      data.finEncrypted = encryptFin(input.fin);
    }
    await tx.studentProfile.update({ where: { id }, data });
    if (cur.userId) {
      const u: Prisma.UserUpdateInput = {};
      if (input.firstName !== undefined || input.lastName !== undefined) u.name = `${input.firstName ?? cur.firstName} ${input.lastName ?? cur.lastName}`;
      if (input.active !== undefined) u.active = input.active;
      if (input.password) u.passwordHash = await bcrypt.hash(input.password, 10);
      if (Object.keys(u).length) await tx.user.update({ where: { id: cur.userId }, data: u });
    }
    await audit(tx, {
      actorUserId,
      action: "student.update",
      entityType: "student",
      entityId: id,
      before: { firstName: cur.firstName, lastName: cur.lastName, grade: cur.grade, active: cur.active },
      after: { firstName: input.firstName, lastName: input.lastName, grade: input.grade, active: input.active, passwordChanged: !!input.password, finChanged: !!input.fin },
    });
  });
  return getStudent(id);
}

const safeFin = (enc: string | null) => {
  if (!enc) return null;
  try {
    return decryptFin(enc);
  } catch {
    return null;
  }
};

const studentSelect = {
  id: true, firstName: true, lastName: true, grade: true, active: true, finEncrypted: true, createdAt: true,
  user: { select: { email: true } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.StudentProfileSelect;

type Row = Prisma.StudentProfileGetPayload<{ select: typeof studentSelect }>;
const present = (s: Row) => ({
  id: s.id, name: `${s.firstName} ${s.lastName}`, firstName: s.firstName, lastName: s.lastName, grade: s.grade, active: s.active,
  email: s.user?.email ?? null, fin: safeFin(s.finEncrypted), classes: s._count.enrollments, createdAt: s.createdAt.toISOString(),
});

/** One query, server-side filtering: every whitespace-separated word must match a name, e-mail or student id; a 7-character FIN matches exactly. */
export function studentSearchWhere(q: string): Prisma.StudentProfileWhereInput {
  const tokens = q.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (!tokens.length) return {};
  const compact = normalizeFin(q);
  const byFin: Prisma.StudentProfileWhereInput[] = /^[A-Z0-9]{7}$/.test(compact) ? [{ finHash: hashFin(compact) }] : [];
  return {
    OR: [
      ...byFin,
      {
        AND: tokens.map((t) => ({
          OR: [
            { firstName: { contains: t, mode: "insensitive" as const } },
            { lastName: { contains: t, mode: "insensitive" as const } },
            { user: { email: { contains: t, mode: "insensitive" as const } } },
            { id: { startsWith: t } },
          ],
        })),
      },
    ],
  };
}

export async function searchStudents(p: { q: string; limit?: number; excludeClassId?: string }) {
  const rows = await prisma.studentProfile.findMany({
    where: { active: true, ...studentSearchWhere(p.q), ...(p.excludeClassId ? { enrollments: { none: { classId: p.excludeClassId } } } : {}) },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    take: Math.min(p.limit ?? 10, 25),
    select: studentSelect,
  });
  return rows.map(present);
}

export async function listStudents(p: { q?: string; active?: boolean; classId?: string; grade?: number; page: number; size: number }) {
  const where: Prisma.StudentProfileWhereInput = {
    ...(p.q ? studentSearchWhere(p.q) : {}),
    ...(p.active !== undefined ? { active: p.active } : {}),
    ...(p.classId ? { enrollments: { some: { classId: p.classId } } } : {}),
    ...(p.grade ? { grade: p.grade } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.studentProfile.count({ where }),
    prisma.studentProfile.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.size, take: p.size, select: { ...studentSelect, parent: { select: { user: { select: { name: true } } } }, enrollments: { select: { class: { select: { name: true } } }, take: 3 } } }),
  ]);
  return {
    total,
    items: rows.map((r) => ({ ...present(r), parentName: r.parent.user.name, classNames: r.enrollments.map((e) => e.class?.name).filter((n): n is string => !!n) })),
  };
}

export async function getStudent(id: string) {
  const s = await prisma.studentProfile.findUnique({
    where: { id },
    select: {
      ...studentSelect,
      birthDate: true,
      parent: { select: { id: true, user: { select: { name: true, email: true, phone: true } } } },
      enrollments: { select: { startedAt: true, class: { select: { id: true, name: true, status: true, teacher: { select: { user: { select: { name: true } } } } } } } },
      notes: { orderBy: { createdAt: "desc" }, take: 30, select: { id: true, body: true, visibility: true, createdAt: true, teacher: { select: { user: { select: { name: true } } } } } },
      payments: { orderBy: [{ createdAt: "desc" }], select: { id: true, title: true, amount: true, status: true, cycle: true, dueDate: true, paidAt: true, class: { select: { id: true, name: true } } } },
    },
  });
  if (!s) throw new ApiError(404, MSG.studentNotFound);
  // attendance + lesson history are separate bounded queries (latest 40), not part of the profile row
  const [attendance, completedByClass] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId: id }, orderBy: { date: "desc" }, take: 40, select: { id: true, status: true, note: true, completed: true, date: true, lesson: { select: { class: { select: { name: true } } } } } }),
    prisma.$queryRaw<{ classId: string; n: bigint }[]>`SELECT l."classId", count(*) AS n FROM "Attendance" a JOIN "Lesson" l ON l."id" = a."lessonId" WHERE a."studentId" = ${id} AND a."completed" GROUP BY l."classId"`,
  ]);
  const done = new Map(completedByClass.map((c) => [c.classId, Number(c.n)]));
  return {
    ...present(s),
    notes: s.notes.map((n) => ({ id: n.id, body: n.body, visibility: n.visibility, teacher: n.teacher.user.name, createdAt: n.createdAt.toISOString() })),
    attendance: attendance.map((a) => ({ id: a.id, status: a.status, note: a.note, completed: a.completed, date: a.date.toISOString(), className: a.lesson.class.name })),
    birthDate: s.birthDate.toISOString().slice(0, 10),
    parent: { id: s.parent.id, name: s.parent.user.name, email: s.parent.user.email, phone: s.parent.user.phone },
    classes: s.enrollments.flatMap((e) => (e.class ? [{ id: e.class.id, name: e.class.name, status: e.class.status, teacher: e.class.teacher.user.name, joinedAt: e.startedAt.toISOString(), completedLessons: done.get(e.class.id) ?? 0 }] : [])),
    payments: s.payments.map((p) => ({ id: p.id, title: p.title, amount: p.amount, status: p.status, cycle: p.cycle, className: p.class?.name ?? null, classId: p.class?.id ?? null, dueDate: p.dueDate.toISOString(), paidAt: p.paidAt?.toISOString() ?? null })),
  };
}

export async function searchParents(q: string, limit = 10) {
  const rows = await prisma.parentProfile.findMany({
    where: { user: { active: true, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}) } },
    orderBy: { user: { name: "asc" } },
    take: Math.min(limit, 25),
    select: { id: true, user: { select: { name: true, email: true } }, _count: { select: { children: true } } },
  });
  return rows.map((r) => ({ id: r.id, name: r.user.name, email: r.user.email, children: r._count.children }));
}
