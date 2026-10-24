// Blog data layer: validation for the author panel, the author's own queries, public (published-only) queries and admin moderation.
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit } from "@/lib/events";
import { categoryLabels, categoryByLabel } from "@/lib/blog/categories";
import { MIN_PUBLISH_CHARS } from "@/lib/blog/constants";
import { autoExcerpt, readingMinutes, slugify } from "@/lib/blog/text";

// ---------- validation ----------

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((u) => /^\/uploads\/[A-Za-z0-9._-]+$/.test(u) || /^https:\/\/[^\s]+$/.test(u), "Şəkil ünvanı düzgün deyil.");

const tagList = z
  .array(z.string().trim().toLowerCase().min(2, "Etiket ən az 2 simvol olmalıdır.").max(30, "Etiket çox uzundur."))
  .max(8, "Ən çox 8 etiket əlavə etmək olar.")
  .transform((t) => Array.from(new Set(t)));


export const postSchema = z.object({
  title: z.string({ required_error: "Başlıq tələb olunur." }).trim().min(5, "Başlıq ən az 5 simvol olmalıdır.").max(120, "Başlıq ən çox 120 simvol ola bilər."),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Ünvan yalnız kiçik latın hərfləri, rəqəmlər və tire olmalıdır.").min(3, "Ünvan ən az 3 simvol olmalıdır.").max(80).optional(),
  excerpt: z.string().trim().max(300, "Qısa təsvir ən çox 300 simvol ola bilər.").default(""),
  content: z.string({ required_error: "Məqalə mətni tələb olunur." }).max(60_000, "Mətn çox uzundur.").default(""),
  coverUrl: imageUrl.nullable().default(null),
  coverAlt: z.string().trim().max(160, "Şəklin təsviri ən çox 160 simvol ola bilər.").default(""),
  category: z.string({ required_error: "Kateqoriya seçin." }).refine((c) => categoryLabels.includes(c), "Kateqoriya düzgün deyil."),
  tags: tagList.default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  /** ISO date-time; empty = now. A future date schedules the post. */
  publishedAt: z.string().datetime({ offset: true }).nullable().default(null),
  metaTitle: z.string().trim().max(70, "SEO başlığı ən çox 70 simvol ola bilər.").default(""),
  metaDescription: z.string().trim().max(170, "SEO təsviri ən çox 170 simvol ola bilər.").default(""),
});
export type PostInput = z.infer<typeof postSchema>;

/** What must be true before a post can go live (a draft may be incomplete). */
export function publishProblems(p: Pick<PostInput, "content" | "coverUrl" | "coverAlt">): Record<string, string> {
  const f: Record<string, string> = {};
  if (p.content.trim().length < MIN_PUBLISH_CHARS) f.content = `Dərc etmək üçün mətn ən az ${MIN_PUBLISH_CHARS} simvol olmalıdır.`;
  if (!p.coverUrl) f.coverUrl = "Dərc etmək üçün qapaq şəkli əlavə edin.";
  else if (!p.coverAlt.trim()) f.coverAlt = "Şəklin təsvirini (alt mətn) yazın: axtarış sistemləri və görmə məhdudiyyəti olanlar üçün lazımdır.";
  return f;
}

// ---------- selects ----------

const cardSelect = {
  id: true, slug: true, title: true, excerpt: true, coverUrl: true, coverAlt: true, category: true, tags: true,
  publishedAt: true, readingMinutes: true, views: true, featured: true,
  author: { select: { position: true, user: { select: { name: true, avatarUrl: true } } } },
} satisfies Prisma.BlogPostSelect;
export type BlogCard = Prisma.BlogPostGetPayload<{ select: typeof cardSelect }>;

const live = (): Prisma.BlogPostWhereInput => ({ status: "PUBLISHED", publishedAt: { lte: new Date() } });

// ---------- author side ----------

export async function authorOf(userId: string) {
  const a = await prisma.blogAuthor.findUnique({ where: { userId }, include: { user: { select: { name: true, avatarUrl: true, email: true, phone: true } } } });
  if (!a) throw new ApiError(404, MSG.notFound);
  return a;
}

async function freeSlug(base: string, exceptId?: string) {
  let slug = base || "yazi";
  for (let n = 2; await prisma.blogPost.findFirst({ where: { slug, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } }); n++) slug = `${base}-${n}`.slice(0, 90);
  return slug;
}

function dataFrom(input: PostInput, existing?: { publishedAt: Date | null; status: "DRAFT" | "PUBLISHED" }) {
  if (input.status === "PUBLISHED") {
    const f = publishProblems(input);
    if (Object.keys(f).length) throw new ApiError(422, Object.values(f)[0], f);
  }
  const publishedAt = input.status === "PUBLISHED" ? (input.publishedAt ? new Date(input.publishedAt) : existing?.publishedAt ?? new Date()) : null;
  return {
    title: input.title, excerpt: input.excerpt || autoExcerpt(input.content), content: input.content,
    coverUrl: input.coverUrl, coverAlt: input.coverAlt, category: input.category, tags: input.tags,
    status: input.status, publishedAt, metaTitle: input.metaTitle, metaDescription: input.metaDescription,
    readingMinutes: readingMinutes(input.content),
  };
}

export async function createPost(authorId: string, input: PostInput) {
  const data = dataFrom(input);
  const slug = await freeSlug(input.slug ?? (slugify(input.title) || "yazi"));
  return prisma.blogPost.create({ data: { ...data, slug, authorId } });
}

export async function updatePost(authorId: string, id: string, input: PostInput) {
  const cur = await prisma.blogPost.findFirst({ where: { id, authorId } });
  if (!cur) throw new ApiError(404, MSG.notFound);
  const data = dataFrom(input, cur);
  let slug = cur.slug;
  if (input.slug && input.slug !== cur.slug) {
    if (await prisma.blogPost.findFirst({ where: { slug: input.slug, id: { not: id } }, select: { id: true } })) throw new ApiError(409, "Bu ünvan başqa yazıda istifadə olunur.", { slug: "Bu ünvan başqa yazıda istifadə olunur." });
    slug = input.slug;
  }
  return prisma.blogPost.update({ where: { id }, data: { ...data, slug } });
}

export async function deleteOwnPost(authorId: string, id: string) {
  const r = await prisma.blogPost.deleteMany({ where: { id, authorId } });
  if (!r.count) throw new ApiError(404, MSG.notFound);
}

export function getOwnPost(authorId: string, id: string) {
  return prisma.blogPost.findFirst({ where: { id, authorId } });
}

export async function listOwnPosts(authorId: string, p: { q?: string; status?: "DRAFT" | "PUBLISHED"; page: number; size: number }) {
  const where: Prisma.BlogPostWhereInput = { authorId, ...(p.status ? { status: p.status } : {}), ...(p.q ? { OR: [{ title: { contains: p.q, mode: "insensitive" } }, { category: { contains: p.q, mode: "insensitive" } }] } : {}) };
  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (p.page - 1) * p.size, take: p.size, select: { id: true, slug: true, title: true, category: true, status: true, publishedAt: true, views: true, readingMinutes: true, coverUrl: true, updatedAt: true, featured: true } }),
    prisma.blogPost.count({ where }),
  ]);
  return { items, total };
}

export async function authorStats(authorId: string) {
  const [published, drafts, scheduled, views, top, recent] = await Promise.all([
    prisma.blogPost.count({ where: { authorId, ...live() } }),
    prisma.blogPost.count({ where: { authorId, status: "DRAFT" } }),
    prisma.blogPost.count({ where: { authorId, status: "PUBLISHED", publishedAt: { gt: new Date() } } }),
    prisma.blogPost.aggregate({ where: { authorId }, _sum: { views: true } }),
    prisma.blogPost.findMany({ where: { authorId, ...live() }, orderBy: { views: "desc" }, take: 5, select: { id: true, title: true, slug: true, views: true } }),
    prisma.blogPost.findMany({ where: { authorId }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, title: true, status: true, publishedAt: true, updatedAt: true } }),
  ]);
  return { published, drafts, scheduled, views: views._sum.views ?? 0, top, recent };
}

export const profileSchema = z.object({
  name: z.string().trim().min(3, "Ad ən az 3 simvol olmalıdır.").max(80).optional(),
  position: z.string().trim().min(2, "Vəzifə ən az 2 simvol olmalıdır.").max(80).optional(),
  bio: z.string().trim().max(600, "Haqqında mətni ən çox 600 simvol ola bilər.").optional(),
  avatarUrl: z.string().trim().regex(/^\/uploads\/[A-Za-z0-9._-]+$/, "Şəkil ünvanı düzgün deyil.").nullable().optional(),
});

export async function updateProfile(userId: string, input: z.infer<typeof profileSchema>) {
  const a = await authorOf(userId);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { ...(input.name !== undefined ? { name: input.name } : {}), ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}) } }),
    prisma.blogAuthor.update({ where: { id: a.id }, data: { ...(input.position !== undefined ? { position: input.position } : {}), ...(input.bio !== undefined ? { bio: input.bio } : {}) } }),
  ]);
  return authorOf(userId);
}

// ---------- public side ----------

export async function listPublic(p: { q?: string; category?: string; page: number; size: number; excludeId?: string }) {
  const where: Prisma.BlogPostWhereInput = {
    ...live(),
    ...(p.category ? { category: p.category } : {}),
    ...(p.excludeId ? { id: { not: p.excludeId } } : {}),
    ...(p.q ? { OR: [{ title: { contains: p.q, mode: "insensitive" } }, { excerpt: { contains: p.q, mode: "insensitive" } }, { content: { contains: p.q, mode: "insensitive" } }, { tags: { has: p.q.toLowerCase() } }] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (p.page - 1) * p.size, take: p.size, select: cardSelect }),
    prisma.blogPost.count({ where }),
  ]);
  return { items, total };
}

export const featuredPost = () => prisma.blogPost.findFirst({ where: { ...live(), featured: true }, orderBy: { publishedAt: "desc" }, select: cardSelect });
export const popularPosts = (n = 4, excludeId?: string) => prisma.blogPost.findMany({ where: { ...live(), ...(excludeId ? { id: { not: excludeId } } : {}) }, orderBy: [{ views: "desc" }, { publishedAt: "desc" }], take: n, select: cardSelect });

export async function categoryCounts() {
  const rows = await prisma.blogPost.groupBy({ by: ["category"], where: live(), _count: { _all: true } });
  const out: { label: string; slug: string; count: number }[] = [];
  for (const r of rows) {
    const c = categoryByLabel(r.category);
    if (c) out.push({ label: c.label, slug: c.slug, count: r._count._all });
  }
  return out;
}

export async function getPublicPost(slug: string) {
  return prisma.blogPost.findFirst({
    where: { slug, ...live() },
    include: { author: { select: { position: true, bio: true, user: { select: { name: true, avatarUrl: true } } } } },
  });
}

/** Same category first, then the newest of the rest. */
export async function relatedPosts(post: { id: string; category: string; tags: string[] }, n = 3) {
  const same = await prisma.blogPost.findMany({ where: { ...live(), id: { not: post.id }, OR: [{ category: post.category }, ...(post.tags.length ? [{ tags: { hasSome: post.tags } }] : [])] }, orderBy: { publishedAt: "desc" }, take: n, select: cardSelect });
  if (same.length >= n) return same;
  const more = await prisma.blogPost.findMany({ where: { ...live(), id: { notIn: [post.id, ...same.map((s) => s.id)] } }, orderBy: { publishedAt: "desc" }, take: n - same.length, select: cardSelect });
  return [...same, ...more];
}

export async function addView(slug: string) {
  await prisma.blogPost.updateMany({ where: { slug, ...live() }, data: { views: { increment: 1 } } });
}

export const allLiveForFeeds = (take = 200) =>
  prisma.blogPost.findMany({ where: live(), orderBy: { publishedAt: "desc" }, take, select: { slug: true, title: true, excerpt: true, content: true, category: true, publishedAt: true, updatedAt: true, coverUrl: true, author: { select: { user: { select: { name: true } } } } } });

// ---------- admin ----------

export async function listAllPosts(p: { q?: string; status?: "DRAFT" | "PUBLISHED"; page: number; size: number }) {
  const where: Prisma.BlogPostWhereInput = { ...(p.status ? { status: p.status } : {}), ...(p.q ? { OR: [{ title: { contains: p.q, mode: "insensitive" } }, { author: { user: { name: { contains: p.q, mode: "insensitive" } } } }] } : {}) };
  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (p.page - 1) * p.size, take: p.size, select: { id: true, slug: true, title: true, category: true, status: true, publishedAt: true, views: true, featured: true, updatedAt: true, author: { select: { user: { select: { name: true } } } } } }),
    prisma.blogPost.count({ where }),
  ]);
  return { items, total };
}

export const moderateSchema = z.object({ status: z.enum(["DRAFT", "PUBLISHED"]).optional(), featured: z.boolean().optional() });

export async function moderatePost(actorUserId: string, id: string, input: z.infer<typeof moderateSchema>) {
  return prisma.$transaction(async (tx) => {
    const cur = await tx.blogPost.findUnique({ where: { id } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    const data: Prisma.BlogPostUpdateInput = {};
    if (input.status === "PUBLISHED" && cur.status !== "PUBLISHED") {
      const f = publishProblems({ content: cur.content, coverUrl: cur.coverUrl, coverAlt: cur.coverAlt });
      if (Object.keys(f).length) throw new ApiError(422, Object.values(f)[0], f);
      data.status = "PUBLISHED";
      data.publishedAt = cur.publishedAt ?? new Date();
    } else if (input.status === "DRAFT") data.status = "DRAFT";
    if (input.featured !== undefined) data.featured = input.featured;
    const next = Object.keys(data).length ? await tx.blogPost.update({ where: { id }, data }) : cur;
    await audit(tx, { actorUserId, action: "blog.moderate", entityType: "blog", entityId: id, before: { status: cur.status, featured: cur.featured }, after: { status: next.status, featured: next.featured } });
    return next;
  });
}

export async function deletePostAdmin(actorUserId: string, id: string) {
  await prisma.$transaction(async (tx) => {
    const cur = await tx.blogPost.findUnique({ where: { id }, select: { title: true, status: true } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    await tx.blogPost.delete({ where: { id } });
    await audit(tx, { actorUserId, action: "blog.delete", entityType: "blog", entityId: id, before: cur });
  });
}

const nameField = z.string({ required_error: "Ad tələb olunur." }).trim().min(3, "Ad ən az 3 simvol olmalıdır.").max(80);
const emailField = z.string({ required_error: "E-poçt tələb olunur." }).trim().toLowerCase().email("E-poçt ünvanı düzgün deyil.").max(120);
const passwordField = z.string({ required_error: "Şifrə tələb olunur." }).min(8, "Şifrə ən az 8 simvol olmalıdır.").max(72, "Şifrə çox uzundur.");

export const authorCreateSchema = z.object({ name: nameField, email: emailField, password: passwordField, position: z.string().trim().min(2).max(80).default("Bloq müəllifi"), bio: z.string().trim().max(600).default("") });
export const authorUpdateSchema = z.object({ active: z.boolean().optional(), password: passwordField.optional(), name: nameField.optional(), position: z.string().trim().min(2).max(80).optional(), bio: z.string().trim().max(600).optional() });

export async function createAuthor(actorUserId: string, input: z.infer<typeof authorCreateSchema>) {
  return prisma.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email: input.email }, select: { id: true } })) throw new ApiError(409, "Bu e-poçt artıq istifadə olunur.", { email: "Bu e-poçt artıq istifadə olunur." });
    const user = await tx.user.create({
      data: { name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 10), role: "BLOGGER", blogAuthor: { create: { position: input.position, bio: input.bio } } },
      select: { id: true, email: true },
    });
    await audit(tx, { actorUserId, action: "blog.author.create", entityType: "blogAuthor", entityId: user.id, after: { email: user.email } });
    return user;
  });
}

export async function updateAuthor(actorUserId: string, userId: string, input: z.infer<typeof authorUpdateSchema>) {
  await prisma.$transaction(async (tx) => {
    const cur = await tx.user.findFirst({ where: { id: userId, role: "BLOGGER" }, select: { active: true, name: true } });
    if (!cur) throw new ApiError(404, MSG.notFound);
    await tx.user.update({ where: { id: userId }, data: { ...(input.active !== undefined ? { active: input.active } : {}), ...(input.name ? { name: input.name } : {}), ...(input.password ? { passwordHash: await bcrypt.hash(input.password, 10) } : {}) } });
    if (input.position !== undefined || input.bio !== undefined) await tx.blogAuthor.update({ where: { userId }, data: { ...(input.position !== undefined ? { position: input.position } : {}), ...(input.bio !== undefined ? { bio: input.bio } : {}) } });
    await audit(tx, { actorUserId, action: input.active !== undefined && input.active !== cur.active ? (input.active ? "blog.author.activate" : "blog.author.deactivate") : "blog.author.update", entityType: "blogAuthor", entityId: userId, before: { active: cur.active, name: cur.name }, after: { active: input.active, name: input.name, passwordChanged: !!input.password } });
  });
}

export function listAuthors() {
  return prisma.blogAuthor.findMany({ include: { user: { select: { id: true, name: true, email: true, active: true } }, _count: { select: { posts: true } } }, orderBy: { user: { name: "asc" } } });
}
