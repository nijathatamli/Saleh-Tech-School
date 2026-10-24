import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListView } from "@/components/blog/blog-list-view";
import { JsonLd } from "@/components/seo/json-ld";
import { categoryBySlug } from "@/lib/blog/categories";
import { SITE_NAME, breadcrumbLd, clip, dynamicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: { category: string }; searchParams: { page?: string } };
const pageOf = (s: Props["searchParams"]) => Math.max(1, Math.min(500, Number(s.page) || 1));

export function generateMetadata({ params, searchParams }: Props): Metadata {
  const c = categoryBySlug(params.category);
  if (!c) return { title: "Kateqoriya tapılmadı", robots: { index: false } };
  const page = pageOf(searchParams);
  return dynamicMetadata({
    title: clip(`${c.label}${page > 1 ? `, səhifə ${page}` : ""} | Bloq | ${SITE_NAME}`, 60),
    description: clip(`${c.label} mövzusunda məqalələr: uşaqlar və valideynlər üçün Saleh Tech School bloqu.`, 160),
    path: `/bloq/kateqoriya/${c.slug}${page > 1 ? `?page=${page}` : ""}`,
    keywords: [c.label, `${c.label} uşaqlar üçün`, "bloq"],
    rss: "/bloq/rss.xml",
  });
}

export default function BlogCategoryPage({ params, searchParams }: Props) {
  const c = categoryBySlug(params.category);
  if (!c) notFound();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Bloq", path: "/bloq" }, { name: c.label, path: `/bloq/kateqoriya/${c.slug}` }])} />
      <BlogListView
        basePath={`/bloq/kateqoriya/${c.slug}`}
        eyebrow={`Bloq · ${c.label}`}
        title={`${c.label}: məqalələr və məsləhətlər`}
        lead={`${c.label} mövzusunda uşaqlar və valideynlər üçün faydalı yazılar.`}
        category={c}
        page={pageOf(searchParams)}
      />
    </>
  );
}
