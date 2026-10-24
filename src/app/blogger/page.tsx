import Link from "next/link";
import { BloggerTopbar } from "@/components/blog/blogger-topbar";
import { PostStatusBadge } from "@/components/blog/post-status";
import { card, fmtDate, EmptyState } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { bloggerGuard } from "@/lib/blog/guard";
import { authorStats } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <div className={`${card} p-4 transition-colors sm:p-5 ${href ? "hover:border-electric-500" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-navy-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-navy-900 sm:text-3xl">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function BloggerDashboard() {
  const { author } = await bloggerGuard();
  const s = await authorStats(author.id);
  const first = author.user.name.split(" ")[0];
  return (
    <div>
      <BloggerTopbar title={`Salam, ${first}`} subtitle="Yazılarınızın vəziyyəti və oxunma statistikası" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Dərc olunub" value={s.published} href="/blogger/yazilar?status=PUBLISHED" />
            <Stat label="Qaralama" value={s.drafts} href="/blogger/yazilar?status=DRAFT" />
            <Stat label="Planlanıb" value={s.scheduled} />
            <Stat label="Ümumi oxunma" value={s.views} />
          </div>
        </div>
        <div className="flex">
          <Button asChild variant="app" size="md"><Link href="/blogger/yazilar/yeni">Yeni yazı yaz</Link></Button>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`${card} p-5`} aria-labelledby="top-posts">
            <h2 id="top-posts" className="font-display text-lg text-navy-900">Ən çox oxunanlar</h2>
            {s.top.length === 0 ? (
              <EmptyState text="Hələ dərc olunmuş yazı yoxdur." hint="İlk yazınızı dərc etdikdən sonra oxunma sayı burada görünəcək." />
            ) : (
              <ol className="mt-4 divide-y divide-navy-50">
                {s.top.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                    <a href={`/bloq/${p.slug}`} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate font-semibold text-navy-900 hover:text-electric-600">{p.title}</a>
                    <span className="shrink-0 text-sm text-navy-400">{p.views} oxunma</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className={`${card} p-5`} aria-labelledby="recent-posts">
            <h2 id="recent-posts" className="font-display text-lg text-navy-900">Son dəyişikliklər</h2>
            {s.recent.length === 0 ? (
              <EmptyState text="Hələ yazı yoxdur." hint="“Yeni yazı yaz” düyməsi ilə başlayın." />
            ) : (
              <ul className="mt-4 divide-y divide-navy-50">
                {s.recent.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link href={`/blogger/yazilar/${p.id}`} className="block truncate font-semibold text-navy-900 hover:text-electric-600">{p.title}</Link>
                      <p className="text-xs text-navy-400">{fmtDate(p.updatedAt)}</p>
                    </div>
                    <PostStatusBadge status={p.status} publishedAt={p.publishedAt} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
