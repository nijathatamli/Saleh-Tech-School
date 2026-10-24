import type { Metadata } from "next";
import { BlogListView } from "@/components/blog/blog-list-view";
import { JsonLd } from "@/components/seo/json-ld";
import { cleanQ } from "@/lib/search";
import { SEO, SITE_NAME, absoluteUrl, breadcrumbLd, dynamicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { searchParams: { q?: string; page?: string } };
const pageOf = (s: Props["searchParams"]) => Math.max(1, Math.min(500, Number(s.page) || 1));

export function generateMetadata({ searchParams }: Props): Metadata {
  const page = pageOf(searchParams);
  const q = cleanQ(searchParams.q);
  return dynamicMetadata({
    title: page > 1 ? `Bloq, səhifə ${page} | ${SITE_NAME}` : SEO.blog.title,
    description: SEO.blog.description,
    path: page > 1 ? `/bloq?page=${page}` : "/bloq",
    keywords: SEO.blog.keywords,
    rss: "/bloq/rss.xml",
    noindex: !!q, // search results are not pages worth indexing
  });
}

export default function BlogPage({ searchParams }: Props) {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([{ name: "Bloq", path: "/bloq" }]),
          { "@context": "https://schema.org", "@type": "Blog", "@id": absoluteUrl("/bloq#blog"), name: `${SITE_NAME} bloqu`, url: absoluteUrl("/bloq"), inLanguage: "az", publisher: { "@id": absoluteUrl("/#organization") } },
        ]}
      />
      <BlogListView
        basePath="/bloq"
        title="Uşaqlar üçün texnologiya, proqramlaşdırma və IT bloqu"
        lead="Robototexnika, kibertəhlükəsizlik, süni intellekt və proqramlaşdırma haqqında məqalələr, valideynlər üçün məsləhətlər və məktəb xəbərləri."
        q={cleanQ(searchParams.q)}
        page={pageOf(searchParams)}
      />
    </>
  );
}
