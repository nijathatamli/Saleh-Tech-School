import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Eye } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BlogCard, CategoryChip, Cover } from "@/components/blog/blog-card";
import { ReadingProgress, ShareButtons, ViewCounter } from "@/components/blog/article-client";
import { BlogMarkdown } from "@/components/blog/markdown";
import { JsonLd } from "@/components/seo/json-ld";
import { categoryByLabel } from "@/lib/blog/categories";
import { getPublicPost, relatedPosts } from "@/lib/blog/posts";
import { extractHeadings, formatBlogDate, wordCount } from "@/lib/blog/text";
import { SITE_NAME, absoluteUrl, breadcrumbLd, clip, dynamicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublicPost(params.slug);
  if (!post) return { title: "Məqalə tapılmadı", robots: { index: false } };
  const base = post.metaTitle || post.title;
  const title = base.length + SITE_NAME.length + 3 <= 60 ? `${base} | ${SITE_NAME}` : clip(base, 60);
  return dynamicMetadata({
    title,
    description: clip(post.metaDescription || post.excerpt, 160),
    path: `/bloq/${post.slug}`,
    keywords: [...post.tags, post.category],
    image: post.coverUrl ? { url: post.coverUrl, alt: post.coverAlt } : undefined,
    article: { publishedTime: post.publishedAt?.toISOString(), modifiedTime: post.updatedAt.toISOString(), authors: [post.author.user.name], tags: post.tags, section: post.category },
  });
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublicPost(params.slug);
  if (!post) notFound();
  const related = await relatedPosts(post, 3);
  const headings = extractHeadings(post.content);
  const cat = categoryByLabel(post.category);
  const url = absoluteUrl(`/bloq/${post.slug}`);
  const cover = post.coverUrl ? (post.coverUrl.startsWith("/") ? absoluteUrl(post.coverUrl) : post.coverUrl) : undefined;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([{ name: "Bloq", path: "/bloq" }, ...(cat ? [{ name: cat.label, path: `/bloq/kateqoriya/${cat.slug}` }] : []), { name: post.title, path: `/bloq/${post.slug}` }]),
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.metaDescription || post.excerpt,
            ...(cover ? { image: [cover] } : {}),
            datePublished: post.publishedAt?.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            author: { "@type": "Person", name: post.author.user.name, jobTitle: post.author.position },
            publisher: { "@id": absoluteUrl("/#organization") },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            articleSection: post.category,
            keywords: post.tags.join(", "),
            wordCount: wordCount(post.content),
            inLanguage: "az",
          },
        ]}
      />
      <ReadingProgress />
      <ViewCounter slug={post.slug} />

      <article id="blog-article" className="px-6 py-16 md:px-20 md:py-20">
        <header className="mx-auto max-w-3xl space-y-5">
          <nav aria-label="Naviqasiya yolu" className="text-xs text-grey-500 dark:text-zinc-400">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-primary">Ana səhifə</Link></li>
              <li aria-hidden>/</li>
              <li><Link href="/bloq" className="hover:text-primary">Bloq</Link></li>
              {cat && (<><li aria-hidden>/</li><li><Link href={`/bloq/kateqoriya/${cat.slug}`} className="hover:text-primary">{cat.label}</Link></li></>)}
            </ol>
          </nav>
          <CategoryChip label={post.category} />
          <h1 className="font-display text-3xl leading-tight md:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="text-lg leading-relaxed text-grey-500 dark:text-zinc-400">{post.excerpt}</p>}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-y border-grey-100 py-4 text-sm text-grey-500 dark:border-zinc-800 dark:text-zinc-400">
            <span className="flex items-center gap-3">
              <Avatar src={post.author.user.avatarUrl} name={post.author.user.name} size={40} />
              <span>
                <span className="block font-bold text-secondary dark:text-white">{post.author.user.name}</span>
                <span className="block text-xs">{post.author.position}</span>
              </span>
            </span>
            {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{formatBlogDate(post.publishedAt)}</time>}
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" aria-hidden /> {post.readingMinutes} dəq oxu</span>
            {post.views > 0 && <span className="flex items-center gap-1"><Eye className="h-4 w-4" aria-hidden /> {post.views} oxunma</span>}
          </div>
        </header>

        <figure className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-[2rem]">
          <Cover src={post.coverUrl} alt={post.coverAlt} priority className="!aspect-[16/9]" />
        </figure>

        <div className="mx-auto mt-12 grid max-w-5xl gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="min-w-0 lg:max-w-3xl">
            <BlogMarkdown source={post.content} />

            {post.tags.length > 0 && (
              <ul aria-label="Etiketlər" className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <li key={t}>
                    <Link href={`/bloq?q=${encodeURIComponent(t)}`} className="rounded-full bg-grey-50 px-3 py-1 text-xs font-semibold text-grey-500 transition-colors hover:bg-primary/10 hover:text-primary dark:bg-zinc-800 dark:text-zinc-400">#{t}</Link>
                  </li>
                ))}
              </ul>
            )}

            <section aria-label="Paylaş" className="mt-10 space-y-3 border-t border-grey-100 pt-8 dark:border-zinc-800">
              <p className="text-sm font-bold">Məqaləni paylaşın</p>
              <ShareButtons url={url} title={post.title} />
            </section>

            <aside aria-label="Müəllif haqqında" className="mt-10 flex gap-5 rounded-3xl bg-grey-50 p-6 dark:bg-zinc-900">
              <Avatar src={post.author.user.avatarUrl} name={post.author.user.name} size={64} className="shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Müəllif</p>
                <p className="font-display text-lg">{post.author.user.name}</p>
                <p className="text-xs text-grey-500 dark:text-zinc-400">{post.author.position}</p>
                {post.author.bio && <p className="mt-2 text-sm leading-relaxed text-grey-500 dark:text-zinc-400">{post.author.bio}</p>}
              </div>
            </aside>
          </div>

          <aside className="hidden lg:block" aria-label="Məqalənin məzmunu">
            <div className="sticky top-28 space-y-6">
              {headings.length > 0 && (
                <nav aria-label="Məzmun" className="rounded-3xl border border-grey-100 p-5 dark:border-zinc-800">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">Bu məqalədə</p>
                  <ol className="space-y-2 text-sm">
                    {headings.map((h) => (
                      <li key={h.id} className={h.level === 3 ? "pl-4" : ""}>
                        <a href={`#${h.id}`} className="text-grey-500 transition-colors hover:text-primary dark:text-zinc-400">{h.text}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <div className="rounded-3xl bg-primary p-5 text-white">
                <p className="font-display text-base leading-snug">Övladınız üçün ödənişsiz sınaq dərsi</p>
                <Button asChild size="sm" className="mt-4 bg-white text-primary shadow-none hover:bg-white"><Link href="/sinaq-dersi">Yazıl</Link></Button>
              </div>
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="blog-related" className="bg-grey-50 px-6 py-20 dark:bg-zinc-900/50 md:px-20">
          <div className="mx-auto max-w-7xl">
            <h2 id="blog-related" className="mb-10 text-center font-display text-2xl md:text-3xl">Oxumağa davam edin</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {related.map((p) => <BlogCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
