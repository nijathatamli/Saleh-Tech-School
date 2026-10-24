import Link from "next/link";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AuthorActions, BlogPostModeration, CreateAuthorDialog } from "@/components/admin/blog-admin";
import { Pagination, card, fmtDate, th, EmptyState } from "@/components/admin/bits";
import { PostStatusBadge } from "@/components/blog/post-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminGuard } from "@/lib/admin/guard";
import { listAllPosts, listAuthors } from "@/lib/blog/posts";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";
const SIZE = 20;

export default async function AdminBlogPage({ searchParams }: { searchParams: { q?: string; status?: string; page?: string } }) {
  await adminGuard();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const status = searchParams.status === "DRAFT" || searchParams.status === "PUBLISHED" ? searchParams.status : undefined;
  const [posts, authors] = await Promise.all([listAllPosts({ q: cleanQ(searchParams.q), status, page, size: SIZE }), listAuthors()]);
  const now = new Date();
  return (
    <div>
      <AdminTopbar title="Bloq" subtitle="Müəlliflər, yazılar və saytda görünüş" />
      <div className="space-y-6 p-6 md:p-10">
        <section className={card} aria-labelledby="blog-authors">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
            <h2 id="blog-authors" className="font-display text-lg text-navy-900">Bloq müəllifləri</h2>
            <CreateAuthorDialog />
          </div>
          <div className="table-scroll overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-navy-100"><th className={th}>Müəllif</th><th className={th}>E-poçt</th><th className={th}>Yazı</th><th className={th}>Status</th><th className={th}></th></tr></thead>
              <tbody>
                {authors.length === 0 && <tr><td colSpan={5} className="px-4 py-4"><EmptyState text="Hələ bloq müəllifi yoxdur." hint="“Müəllif əlavə et” ilə hesab yaradın; müəllif /giris səhifəsindən daxil olub öz panelini görəcək." /></td></tr>}
                {authors.map((a) => (
                  <tr key={a.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-4 py-3"><p className="font-bold text-navy-900">{a.user.name}</p><p className="text-xs text-navy-400">{a.position}</p></td>
                    <td className="px-4 py-3 text-navy-600">{a.user.email}</td>
                    <td className="px-4 py-3 font-bold">{a._count.posts}</td>
                    <td className="px-4 py-3"><Badge variant={a.user.active ? "success" : "default"}>{a.user.active ? "Aktiv" : "Deaktiv"}</Badge></td>
                    <td className="px-4 py-3"><AuthorActions userId={a.user.id} active={a.user.active} name={a.user.name} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="blog-posts">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="blog-posts" className="font-display text-lg text-navy-900">Bütün yazılar</h2>
            <form method="GET" className="flex flex-wrap items-end gap-3" role="search">
              <input name="q" defaultValue={searchParams.q} placeholder="Başlıq və ya müəllif..." aria-label="Axtar" className="w-64 rounded-xl border border-navy-100 bg-white px-4 py-2.5 text-sm" />
              <select name="status" defaultValue={status ?? ""} aria-label="Status" className="rounded-xl border border-navy-100 bg-white px-3 py-2.5 text-sm"><option value="">Hamısı</option><option value="PUBLISHED">Dərc olunub / planlanıb</option><option value="DRAFT">Qaralama</option></select>
              <Button type="submit" variant="app-outline" size="sm">Axtar</Button>
            </form>
          </div>
          <div className={card}>
            <div className="table-scroll overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-navy-100"><th className={th}>Yazı</th><th className={th}>Müəllif</th><th className={th}>Status</th><th className={th}>Tarix</th><th className={th}>Oxunma</th><th className={th}></th></tr></thead>
                <tbody>
                  {posts.items.length === 0 && <tr><td colSpan={6} className="px-4 py-4"><EmptyState text="Yazı tapılmadı." hint="Axtarışı və ya filtri dəyişin." /></td></tr>}
                  {posts.items.map((p) => {
                    const live = p.status === "PUBLISHED" && !!p.publishedAt && p.publishedAt <= now;
                    return (
                      <tr key={p.id} className="border-b border-navy-50 last:border-0">
                        <td className="px-4 py-3">
                          {live ? <Link href={`/bloq/${p.slug}`} target="_blank" className="font-bold text-navy-900 hover:text-electric-600">{p.title}</Link> : <span className="font-bold text-navy-900">{p.title}</span>}
                          <p className="text-xs text-navy-400">{p.category}{p.featured ? " · Seçilmiş" : ""}</p>
                        </td>
                        <td className="px-4 py-3 text-navy-600">{p.author.user.name}</td>
                        <td className="px-4 py-3"><PostStatusBadge status={p.status} publishedAt={p.publishedAt} /></td>
                        <td className="px-4 py-3 text-navy-600">{p.status === "PUBLISHED" ? fmtDate(p.publishedAt) : `Dəyişib: ${fmtDate(p.updatedAt)}`}</td>
                        <td className="px-4 py-3 font-bold">{p.views}</td>
                        <td className="px-4 py-3"><BlogPostModeration id={p.id} status={p.status} featured={p.featured} title={p.title} live={live} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination base="/admin/blog" params={{ q: searchParams.q, status }} page={page} total={posts.total} size={SIZE} />
          </div>
        </section>
      </div>
    </div>
  );
}
