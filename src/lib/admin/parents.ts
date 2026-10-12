// Parent accounts and the parent ↔ student link. A student always has exactly one parent record
// (the schema requires it), so "removing" a link means moving the student to another parent;
// the student's payments follow, so billing is never orphaned.
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit, notifyUsers } from "@/lib/events";

const nameField = z.string({ required_error: "Ad tələb olunur." }).trim().min(3, "Ad ən az 3 simvol olmalıdır.").max(80);
const emailField = z.string({ required_error: "E-poçt tələb olunur." }).trim().toLowerCase().email("E-poçt ünvanı düzgün deyil.").max(120);
const passwordField = z.string({ required_error: "Şifrə tələb olunur." }).min(8, "Şifrə ən az 8 simvol olmalıdır.").max(72);

export const parentCreateSchema = z.object({ name: nameField, email: emailField, password: passwordField, phone: z.string().trim().max(30).optional() });
export const parentUpdateSchema = z.object({ name: nameField.optional(), phone: z.string().trim().max(30).nullable().optional(), active: z.boolean().optional(), password: passwordField.optional() });
export const moveStudentSchema = z.object({ parentId: z.string().min(1, "Valideyn seçin.") });

export async function createParent(actorUserId: string, input: z.infer<typeof parentCreateSchema>) {
  const id = await prisma.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email: input.email }, select: { id: true } })) throw new ApiError(409, "Bu e-poçt artıq istifadə olunur.", { email: "Bu e-poçt artıq istifadə olunur." });
    const u = await tx.user.create({ data: { name: input.name, email: input.email, phone: input.phone || null, passwordHash: await bcrypt.hash(input.password, 10), role: "PARENT", parentProfile: { create: {} } }, include: { parentProfile: true } });
    await audit(tx, { actorUserId, action: "parent.create", entityType: "parent", entityId: u.parentProfile!.id, after: { userId: u.id, email: u.email } });
    return u.parentProfile!.id;
  });
  return getParent(id);
}

export async function updateParent(actorUserId: string, id: string, input: z.infer<typeof parentUpdateSchema>) {
  await prisma.$transaction(async (tx) => {
    const cur = await tx.parentProfile.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, active: true } } } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    const u: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) u.name = input.name;
    if (input.phone !== undefined) u.phone = input.phone || null;
    if (input.active !== undefined) u.active = input.active;
    if (input.password) u.passwordHash = await bcrypt.hash(input.password, 10);
    if (Object.keys(u).length) await tx.user.update({ where: { id: cur.user.id }, data: u });
    await audit(tx, { actorUserId, action: "parent.update", entityType: "parent", entityId: id, before: { name: cur.user.name, active: cur.user.active }, after: { name: input.name, active: input.active, passwordChanged: !!input.password } });
  });
  return getParent(id);
}

/** Moves a student (and the student's payment records) to another parent. */
export async function moveStudentToParent(actorUserId: string, studentId: string, parentId: string) {
  await prisma.$transaction(async (tx) => {
    const s = await tx.studentProfile.findUnique({ where: { id: studentId }, select: { id: true, parentId: true, firstName: true, lastName: true, parent: { select: { userId: true } } } });
    if (!s) throw new ApiError(404, MSG.studentNotFound);
    const target = await tx.parentProfile.findFirst({ where: { id: parentId, user: { active: true } }, select: { id: true, userId: true } });
    if (!target) throw new ApiError(404, "Valideyn tapılmadı.", { parentId: "Valideyn tapılmadı." });
    if (target.id === s.parentId) return;
    await tx.studentProfile.update({ where: { id: studentId }, data: { parentId: target.id } });
    const moved = await tx.payment.updateMany({ where: { studentId }, data: { parentId: target.id } });
    await audit(tx, { actorUserId, action: "student.parent.change", entityType: "student", entityId: studentId, before: { parentId: s.parentId }, after: { parentId: target.id, paymentsMoved: moved.count } });
    const name = `${s.firstName} ${s.lastName}`;
    await notifyUsers(tx, [s.parent.userId], { title: "Əlaqə dəyişdi", body: `${name} artıq sizin hesabınıza bağlı deyil.`, type: "warning", event: "GENERAL", entityType: "student", entityId: studentId });
    await notifyUsers(tx, [target.userId], { title: "Yeni övlad əlavə olundu", body: `${name} hesabınıza bağlandı.`, type: "info", event: "GENERAL", entityType: "student", entityId: studentId });
  });
}

export async function listParents(p: { q?: string; page: number; size: number }) {
  const where: Prisma.ParentProfileWhereInput = p.q ? { user: { OR: [{ name: { contains: p.q, mode: "insensitive" } }, { email: { contains: p.q, mode: "insensitive" } }, { phone: { contains: p.q } }] } } : {};
  const [total, rows] = await Promise.all([
    prisma.parentProfile.count({ where }),
    prisma.parentProfile.findMany({ where, orderBy: [{ user: { name: "asc" } }, { id: "asc" }], skip: (p.page - 1) * p.size, take: p.size, select: { id: true, user: { select: { name: true, email: true, phone: true, active: true } }, children: { select: { id: true, firstName: true, lastName: true } } } }),
  ]);
  return { total, items: rows.map((r) => ({ id: r.id, name: r.user.name, email: r.user.email, phone: r.user.phone, active: r.user.active, children: r.children.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` })) })) };
}

export async function getParent(id: string) {
  const r = await prisma.parentProfile.findUnique({
    where: { id },
    select: {
      id: true, user: { select: { name: true, email: true, phone: true, active: true } },
      children: { orderBy: { firstName: "asc" }, select: { id: true, firstName: true, lastName: true, grade: true, active: true, enrollments: { where: { class: { status: "ACTIVE" } }, select: { class: { select: { id: true, name: true, teacher: { select: { user: { select: { name: true } } } } } } } } } },
    },
  });
  if (!r) throw new ApiError(404, MSG.notFound);
  const due = await prisma.payment.count({ where: { parentId: id, status: "DUE" } });
  return {
    id: r.id, name: r.user.name, email: r.user.email, phone: r.user.phone, active: r.user.active, paymentsDue: due,
    children: r.children.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`, grade: c.grade, active: c.active, classes: c.enrollments.flatMap((e) => (e.class ? [{ id: e.class.id, name: e.class.name, teacher: e.class.teacher.user.name }] : [])) })),
  };
}

/** Small payload for pickers: id, name, e-mail and how many children are linked. */
export async function searchParentsLite(q: string, limit = 10) {
  const rows = await prisma.parentProfile.findMany({
    where: { user: { active: true, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {}) } },
    orderBy: { user: { name: "asc" } },
    take: Math.min(limit, 25),
    select: { id: true, user: { select: { name: true, email: true } }, _count: { select: { children: true } } },
  });
  return rows.map((r) => ({ id: r.id, name: r.user.name, email: r.user.email, children: r._count.children }));
}
