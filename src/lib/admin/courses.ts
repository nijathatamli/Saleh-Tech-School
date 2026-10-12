// Course = what is taught (catalogue + curriculum). Class = one concrete group of students. Courses are
// never deleted: they are switched inactive, which hides them from the public site and from the new-class
// picker while keeping every class, lesson and payment that refers to them.
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit } from "@/lib/events";



const slugify = (s: string) =>
  s.toLowerCase().replace(/ə/g, "e").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const moduleSchema = z.object({ title: z.string().trim().min(2, "Modulun adı tələb olunur.").max(120), summary: z.string().trim().max(300).default("") });

const base = {
  name: z.string({ required_error: "Kursun adı tələb olunur." }).trim().min(2, "Kursun adı ən az 2 simvol olmalıdır.").max(80),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug yalnız kiçik latın hərfləri, rəqəm və defisdən ibarət olmalıdır.").max(80).optional(),
  shortDesc: z.string({ required_error: "Qısa təsvir tələb olunur." }).trim().min(5, "Qısa təsvir tələb olunur.").max(200),
  longDesc: z.string().trim().max(5000).default(""),
  category: z.string({ required_error: "Kateqoriya tələb olunur." }).trim().toLowerCase().regex(/^[a-z0-9-]{2,30}$/, "Kateqoriya yalnız kiçik latın hərfləri, rəqəm və defisdən ibarət olmalıdır."),
  minAge: z.number().int().min(3).max(25),
  maxAge: z.number().int().min(3).max(25),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  durationMonths: z.number().int().min(1).max(60),
  lessonsPerWeek: z.number().int().min(1).max(14),
  lessonMinutes: z.number().int().min(15).max(240),
  price: z.number().int().min(0, "Qiymət mənfi ola bilməz.").max(100000),
  tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  teacherId: z.string().min(1).nullable().optional(),
  coverImageUrl: z.string().trim().max(300).nullable().optional(),
  modules: z.array(moduleSchema).max(40).default([]),
};
const ageOk = (v: { minAge?: number; maxAge?: number }) => v.minAge === undefined || v.maxAge === undefined || v.minAge <= v.maxAge;
export const courseCreateSchema = z.object(base).refine(ageOk, { path: ["maxAge"], message: "Maksimum yaş minimumdan kiçik ola bilməz." });
export const courseUpdateSchema = z.object(base).partial().refine(ageOk, { path: ["maxAge"], message: "Maksimum yaş minimumdan kiçik ola bilməz." });

async function checkTeacher(tx: Prisma.TransactionClient, teacherId?: string | null) {
  if (!teacherId) return;
  if (!(await tx.teacherProfile.findFirst({ where: { id: teacherId, user: { role: "TEACHER", active: true } }, select: { id: true } }))) throw new ApiError(404, MSG.teacherNotFound, { teacherId: MSG.teacherNotFound });
}

async function uniqueSlug(tx: Prisma.TransactionClient, wanted: string, ignoreId?: string) {
  let slug = wanted || "kurs";
  for (let i = 2; await tx.course.findFirst({ where: { slug, ...(ignoreId ? { id: { not: ignoreId } } : {}) }, select: { id: true } }); i++) slug = `${wanted}-${i}`;
  return slug;
}

export async function createCourse(actorUserId: string, input: z.infer<typeof courseCreateSchema>) {
  const id = await prisma.$transaction(async (tx) => {
    await checkTeacher(tx, input.teacherId);
    if (input.slug && (await tx.course.findUnique({ where: { slug: input.slug }, select: { id: true } }))) throw new ApiError(409, "Bu slug artıq istifadə olunur.", { slug: "Bu slug artıq istifadə olunur." });
    const { modules, slug, ...rest } = input;
    const course = await tx.course.create({
      data: { ...rest, teacherId: rest.teacherId ?? null, coverImageUrl: rest.coverImageUrl ?? null, slug: slug ?? (await uniqueSlug(tx, slugify(input.name))), modules: { create: modules.map((m, i) => ({ order: i + 1, title: m.title, summary: m.summary })) } },
    });
    await audit(tx, { actorUserId, action: "course.create", entityType: "course", entityId: course.id, after: { name: course.name, price: course.price, active: course.active } });
    return course.id;
  });
  return getCourse(id);
}

export async function updateCourse(actorUserId: string, id: string, input: z.infer<typeof courseUpdateSchema>) {
  await prisma.$transaction(async (tx) => {
    const cur = await tx.course.findUnique({ where: { id } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    await checkTeacher(tx, input.teacherId);
    if (input.slug && input.slug !== cur.slug && (await tx.course.findUnique({ where: { slug: input.slug }, select: { id: true } }))) throw new ApiError(409, "Bu slug artıq istifadə olunur.", { slug: "Bu slug artıq istifadə olunur." });
    if ((input.minAge ?? cur.minAge) > (input.maxAge ?? cur.maxAge)) throw new ApiError(400, "Maksimum yaş minimumdan kiçik ola bilməz.", { maxAge: "Maksimum yaş minimumdan kiçik ola bilməz." });
    const { modules, ...rest } = input;
    await tx.course.update({ where: { id }, data: rest });
    if (modules) {
      await tx.courseModule.deleteMany({ where: { courseId: id } });
      await tx.courseModule.createMany({ data: modules.map((m, i) => ({ courseId: id, order: i + 1, title: m.title, summary: m.summary })) });
    }
    const flipped = input.active !== undefined && input.active !== cur.active;
    await audit(tx, {
      actorUserId, action: flipped ? (input.active ? "course.activate" : "course.deactivate") : "course.update", entityType: "course", entityId: id,
      before: { name: cur.name, price: cur.price, active: cur.active }, after: { name: input.name ?? cur.name, price: input.price ?? cur.price, active: input.active ?? cur.active, modules: modules?.length },
    });
  });
  return getCourse(id);
}

export async function listAdminCourses(p: { q?: string; active?: boolean; page: number; size: number }) {
  const where: Prisma.CourseWhereInput = {
    ...(p.active !== undefined ? { active: p.active } : {}),
    ...(p.q ? { OR: [{ name: { contains: p.q, mode: "insensitive" } }, { category: { contains: p.q, mode: "insensitive" } }, { slug: { contains: p.q, mode: "insensitive" } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: (p.page - 1) * p.size, take: p.size, select: { id: true, slug: true, name: true, category: true, level: true, minAge: true, maxAge: true, price: true, active: true, featured: true, durationMonths: true, teacher: { select: { user: { select: { name: true } } } }, _count: { select: { classes: { where: { status: "ACTIVE" } }, modules: true } } } }),
  ]);
  return { total, items: rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name, category: c.category, level: c.level, minAge: c.minAge, maxAge: c.maxAge, price: c.price, active: c.active, featured: c.featured, durationMonths: c.durationMonths, teacherName: c.teacher?.user.name ?? null, activeClasses: c._count.classes, modules: c._count.modules })) };
}

export async function getCourse(id: string) {
  const c = await prisma.course.findUnique({ where: { id }, include: { modules: { orderBy: { order: "asc" } }, teacher: { select: { id: true, user: { select: { name: true } } } }, _count: { select: { classes: { where: { status: "ACTIVE" } }, enrollments: true } } } });
  if (!c) throw new ApiError(404, MSG.notFound);
  return {
    id: c.id, slug: c.slug, name: c.name, shortDesc: c.shortDesc, longDesc: c.longDesc, category: c.category, minAge: c.minAge, maxAge: c.maxAge, level: c.level,
    durationMonths: c.durationMonths, lessonsPerWeek: c.lessonsPerWeek, lessonMinutes: c.lessonMinutes, price: c.price, tags: c.tags, featured: c.featured, active: c.active,
    coverImageUrl: c.coverImageUrl, teacher: c.teacher ? { id: c.teacher.id, name: c.teacher.user.name } : null,
    modules: c.modules.map((m) => ({ title: m.title, summary: m.summary })), activeClasses: c._count.classes, enrollments: c._count.enrollments,
  };
}
