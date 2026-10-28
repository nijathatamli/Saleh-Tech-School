import Link from "next/link";
import { Clock } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { BlogCard as Card } from "@/lib/blog/posts";
import { categoryByLabel } from "@/lib/blog/categories";
import { formatBlogDate } from "@/lib/blog/text";

export function CategoryChip({ label, className = "" }: { label: string; className?: string }) {
  const c = categoryByLabel(label);
  const cls = `inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary ${className}`;
  return c ? (
    <Link href={`/bloq/kateqoriya/${c.slug}`} className={`${cls} transition-colors hover:bg-primary hover:text-white`}>
      {label}
    </Link>
  ) : (
    <span className={cls}>{label}</span>
  );
}

/** Cover picture with a fixed 16:10 box (no layout shift). Plain <img>: uploads are served by a route, not the image optimizer. */
export function Cover({ src, alt, priority = false, className = "" }: { src: string | null; alt: string; priority?: boolean; className?: string }) {
  return (
    <div className={`relative aspect-[16/10] overflow-hidden bg-grey-100 dark:bg-zinc-800 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={1200} height={750} loading={priority ? "eager" : "lazy"} decoding="async" {...(priority ? { fetchPriority: "high" as const } : {})} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-5xl" aria-hidden>🦊</div>
      )}
    </div>
  );
}

export function PostMeta({ post, className = "" }: { post: Pick<Card, "author" | "publishedAt" | "readingMinutes">; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-grey-500 dark:text-zinc-400 ${className}`}>
      <span className="flex items-center gap-2">
        <Avatar src={post.author.user.avatarUrl} name={post.author.user.name} size={24} />
        <span className="font-semibold text-secondary dark:text-white">{post.author.user.name}</span>
      </span>
      {post.publishedAt && <time dateTime={post.publishedAt.toISOString()}>{formatBlogDate(post.publishedAt)}</time>}
      <span className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" aria-hidden /> {post.readingMinutes} dəq oxu
      </span>
    </div>
  );
}

export function BlogCard({ post, priority = false }: { post: Card; priority?: boolean }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-grey-100 bg-white transition-all hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/40">
      <Link href={`/bloq/${post.slug}`} className="block" tabIndex={-1} aria-hidden>
        <Cover src={post.coverUrl} alt="" priority={priority} />
      </Link>
      <div className="glass glass-lift glass-sweep relative -mt-14 mx-3 mb-3 flex flex-1 flex-col gap-3 rounded-2xl p-5 text-secondary dark:text-white">
        <CategoryChip label={post.category} className="self-start" />
        <h3 className="font-display text-lg leading-snug">
          <Link href={`/bloq/${post.slug}`} className="transition-colors hover:text-primary">
            {post.title}
          </Link>
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-grey-800/80 dark:text-zinc-300">{post.excerpt}</p>
        <PostMeta post={post} className="mt-auto pt-3" />
      </div>
    </article>
  );
}

export function FeaturedCard({ post }: { post: Card }) {
  return (
    <article className="group relative grid overflow-hidden rounded-[2rem] border border-grey-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 md:grid-cols-2">
      <Link href={`/bloq/${post.slug}`} className="block" tabIndex={-1} aria-hidden>
        <Cover src={post.coverUrl} alt="" priority className="h-full md:aspect-auto md:min-h-[22rem]" />
      </Link>
      <div className="glass glass-strong relative m-3 flex flex-col justify-center gap-4 rounded-3xl p-8 text-secondary dark:text-white md:-ml-16 md:my-8 md:mr-8 md:p-10">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">Seçilmiş yazı</span>
          <CategoryChip label={post.category} />
        </div>
        <h2 className="font-display text-2xl leading-tight md:text-3xl">
          <Link href={`/bloq/${post.slug}`} className="transition-colors hover:text-primary">
            {post.title}
          </Link>
        </h2>
        <p className="leading-relaxed text-grey-800/80 dark:text-zinc-300">{post.excerpt}</p>
        <PostMeta post={post} />
      </div>
    </article>
  );
}
