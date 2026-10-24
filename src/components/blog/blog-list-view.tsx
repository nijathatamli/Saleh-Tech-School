import Link from "next/link";
import { Search, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/marketing/page-intro";
import { BlogCard, FeaturedCard } from "@/components/blog/blog-card";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";
import { categoryCounts, featuredPost, listPublic, popularPosts } from "@/lib/blog/posts";

const SIZE = 9;

/** Shared by /bloq and /bloq/kateqoriya/[category]: header, search, category chips, optional featured post, grid, pagination. */
export async function BlogListView({ title, lead, eyebrow = "Bloq", basePath, category, q, page }: { title: string; lead: string; eyebrow?: string; basePath: string; category?: { slug: string; label: string }; q?: string; page: number }) {
  const plain = !category && !q && page === 1;
  const [counts, featured] = await Promise.all([categoryCounts(), plain ? featuredPost() : Promise.resolve(null)]);
  const { items, total } = await listPublic({ q, category: category?.label, page, size: SIZE, excludeId: featured?.id });
  const popular = plain ? await popularPosts(4, featured?.id) : [];
  const pages = Math.max(1, Math.ceil(total / SIZE));
  const countOf = (label: string) => counts.find((c) => c.label === label)?.count ?? 0;
  const allCount = counts.reduce((n, c) => n + c.count, 0);
  const href = (p: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-white" : "border-grey-200 hover:border-primary hover:text-primary dark:border-zinc-700"}`;

  return (
    <div className="px-6 py-20 md:px-20">
      <PageIntro eyebrow={eyebrow} title={title} lead={lead} />

      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Bloq kateqoriyaları" className="flex flex-wrap gap-2">
            <Link href="/bloq" className={chip(!category)} aria-current={!category ? "page" : undefined}>
              Hamısı <span className="opacity-60">· {allCount}</span>
            </Link>
            {BLOG_CATEGORIES.filter((c) => countOf(c.label) > 0 || category?.slug === c.slug).map((c) => (
              <Link key={c.slug} href={`/bloq/kateqoriya/${c.slug}`} className={chip(category?.slug === c.slug)} aria-current={category?.slug === c.slug ? "page" : undefined}>
                {c.label} <span className="opacity-60">· {countOf(c.label)}</span>
              </Link>
            ))}
          </nav>
          <form action={basePath} method="GET" role="search" className="flex gap-2">
            <label htmlFor="blog-q" className="sr-only">Məqalə axtar</label>
            <input id="blog-q" name="q" defaultValue={q} maxLength={80} placeholder="Məqalə axtar..." className="w-full min-w-0 rounded-full border border-grey-200 bg-white px-5 py-2.5 text-sm outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 md:w-64" />
            <Button type="submit" size="md" aria-label="Axtar"><Search className="h-4 w-4" /></Button>
          </form>
        </div>

        {featured && <FeaturedCard post={featured} />}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-grey-200 px-6 py-20 text-center dark:border-zinc-700">
            <p className="font-display text-xl">{q ? "Axtarışa uyğun məqalə tapılmadı." : "Hələ məqalə yoxdur."}</p>
            <p className="mt-2 text-sm text-grey-500 dark:text-zinc-400">{q ? "Başqa sözlə axtarın və ya kateqoriyalardan birini seçin." : "Tezliklə burada yeni məqalələr olacaq."}</p>
            {(q || category) && (
              <Button asChild className="mt-6"><Link href="/bloq">Bütün məqalələr</Link></Button>
            )}
          </div>
        ) : (
          <section aria-label="Məqalələr" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => <BlogCard key={p.id} post={p} priority={i < 3 && page === 1} />)}
          </section>
        )}

        {pages > 1 && (
          <nav aria-label="Səhifələmə" className="flex items-center justify-center gap-2">
            {page > 1 && <Link href={href(page - 1)} rel="prev" className={chip(false)}>Əvvəlki</Link>}
            {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((p) => (
              <Link key={p} href={href(p)} className={chip(p === page)} aria-current={p === page ? "page" : undefined}>{p}</Link>
            ))}
            {page < pages && <Link href={href(page + 1)} rel="next" className={chip(false)}>Növbəti</Link>}
          </nav>
        )}

        {popular.length > 0 && (
          <section aria-labelledby="blog-popular" className="border-t border-grey-100 pt-12 dark:border-zinc-800">
            <h2 id="blog-popular" className="mb-6 font-display text-2xl">Ən çox oxunanlar</h2>
            <ol className="grid gap-4 md:grid-cols-2">
              {popular.map((p, i) => (
                <li key={p.id} className="flex gap-4 rounded-2xl border border-grey-100 p-4 dark:border-zinc-800">
                  <span className="font-display text-2xl text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <Link href={`/bloq/${p.slug}`} className="font-bold leading-snug transition-colors hover:text-primary">{p.title}</Link>
                    <p className="mt-1 text-xs text-grey-500 dark:text-zinc-400">{p.category} · {p.views} oxunma</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="rounded-[2rem] bg-primary px-8 py-12 text-center text-white md:px-16">
          <h2 className="font-display text-2xl md:text-3xl">Övladınız texnologiyanı sınaqdan keçirsin</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">Ödənişsiz sınaq dərsinə yazılın, müəllimlə tanış olun və uyğun kursu seçin.</p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-primary shadow-none hover:bg-white"><Link href="/sinaq-dersi">Ödənişsiz sınaq dərsinə yazıl</Link></Button>
            <a href="/bloq/rss.xml" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"><Rss className="h-4 w-4" aria-hidden /> RSS ilə izlə</a>
          </div>
        </section>
      </div>
    </div>
  );
}
