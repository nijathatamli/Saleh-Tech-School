import Link from "next/link";
import { BloggerTopbar } from "@/components/blog/blogger-topbar";
import { OwnPostActions } from "@/components/blog/own-post-actions";
import { PostStatusBadge } from "@/components/blog/post-status";
import { Pagination, card, fmtDate, th, EmptyState } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { bloggerGuard } from "@/lib/blog/guard";
import { listOwnPosts } from "@/lib/blog/posts";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function OwnPostsPage({ searchParams }: { searchParams: { q?: string; status?: string; page?: string } }) {
  const { author } = await bloggerGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = searchParams.status === "DRAFT" || searchParams.status === "PUBLISHED" ? searchParams.status : undefined;
  const data = await listOwnPosts(author.id, { q: cleanQ(searchParams.q), status, page, size: SIZE });
  return (
    <div>
      <BloggerTopbar title="Yazılarım" subtitle="Qaralamalar, planlanmış və dərc olunmuş məqalələr" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
            <input name="q" defaultValue={searchParams.q} placeholder="Başlıq və ya kateqoriya..." aria-label="Axtar" className="w-64 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
            <select name="status" defaultValue={status ?? ""} aria-label="Status" className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm">
              <option value="">Hamısı</option>
              <option value="PUBLISHED">Dərc olunub / planlanıb</option>
              <option value="DRAFT">Qaralama</option>
            </select>
            <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
          </form>
          <Button asChild variant="app" size="md"><Link href="/blogger/yazilar/yeni">Yeni yazı</Link></Button>
        </div>
        <div className={card}>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Yazı</th><th className={th}>Kateqoriya</th><th className={th}>Status</th><th className={th}>Tarix</th><th className={th}>Oxunma</th><th className={th}></th></tr></thead>
              <tbody>
                {data.items.length === 0 && <tr><td colSpan={6} className="px-4 py-4"><EmptyState text="Yazı tapılmadı." hint={searchParams.q || status ? "Axtarışı və ya filtri dəyişin." : "“Yeni yazı” düyməsi ilə ilk məqalənizi yazın."} /></td></tr>}
                {data.items.map((p) => (
                  <tr key={p.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/blogger/yazilar/${p.id}`} className="font-bold text-navy-900 hover:text-electric-600">{p.title}</Link>
                      <p className="text-xs text-navy-400">{p.readingMinutes} dəq oxu{p.featured ? " · Seçilmiş" : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-navy-600">{p.category}</td>
                    <td className="px-4 py-3"><PostStatusBadge status={p.status} publishedAt={p.publishedAt} /></td>
                    <td className="px-4 py-3 text-navy-600">{p.status === "PUBLISHED" ? fmtDate(p.publishedAt) : `Dəyişib: ${fmtDate(p.updatedAt)}`}</td>
                    <td className="px-4 py-3 font-bold">{p.views}</td>
                    <td className="px-4 py-3"><OwnPostActions id={p.id} slug={p.slug} title={p.title} live={p.status === "PUBLISHED" && !!p.publishedAt && p.publishedAt <= new Date()} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination base="/blogger/yazilar" params={{ q: searchParams.q, status }} page={page} total={data.total} size={SIZE} />
        </div>
      </div>
    </div>
  );
}
