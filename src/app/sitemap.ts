import type { MetadataRoute } from "next";
import { getAllCourses, getTeachers } from "@/lib/data";
import { SEO, absoluteUrl, type SeoKey } from "@/lib/seo";
import { allLiveForFeeds, categoryCounts } from "@/lib/blog/posts";
import { SCHOLARSHIP_BASE } from "@/lib/scholarship/config";

export const dynamic = "force-dynamic";

const priority: Partial<Record<SeoKey, number>> = { blog: 0.8, home: 1, courses: 0.9, registration: 0.9, scholarship: 0.8, parents: 0.7, about: 0.7, reviews: 0.6, teachers: 0.6, contact: 0.6, vacancies: 0.4 };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, teachers, posts, cats] = await Promise.all([getAllCourses(), getTeachers(), allLiveForFeeds(500), categoryCounts()]);
  const pages = (Object.keys(SEO) as SeoKey[]).map((k) => ({ url: absoluteUrl(SEO[k].path), changeFrequency: "weekly" as const, priority: priority[k] ?? 0.5 }));
  return [
    ...pages,
    { url: absoluteUrl(`${SCHOLARSHIP_BASE}/hazirliq`), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl(`${SCHOLARSHIP_BASE}/qeydiyyat`), changeFrequency: "monthly", priority: 0.6 },
    ...courses.map((c) => ({ url: absoluteUrl(`/kurslar/${c.slug}`), lastModified: c.createdAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...cats.map((c) => ({ url: absoluteUrl(`/bloq/kateqoriya/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...posts.map((p) => ({ url: absoluteUrl(`/bloq/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...teachers.map((t) => ({ url: absoluteUrl(`/muellimler/${t.id}`), changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
