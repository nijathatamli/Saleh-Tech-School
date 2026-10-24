import { allLiveForFeeds } from "@/lib/blog/posts";
import { SITE_NAME, SITE_URL, SEO, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const posts = await allLiveForFeeds(50);
  const items = posts
    .map((p) => {
      const url = absoluteUrl(`/bloq/${p.slug}`);
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><pubDate>${(p.publishedAt ?? p.updatedAt).toUTCString()}</pubDate><dc:creator>${esc(p.author.user.name)}</dc:creator><category>${esc(p.category)}</category><description>${esc(p.excerpt)}</description>${p.coverUrl ? `<enclosure url="${esc(p.coverUrl.startsWith("/") ? SITE_URL + p.coverUrl : p.coverUrl)}" type="image/${p.coverUrl.endsWith(".png") ? "png" : p.coverUrl.endsWith(".webp") ? "webp" : "jpeg"}" length="0"/>` : ""}</item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>${esc(SITE_NAME)} bloqu</title><link>${absoluteUrl("/bloq")}</link><atom:link href="${absoluteUrl("/bloq/rss.xml")}" rel="self" type="application/rss+xml"/><description>${esc(SEO.blog.description)}</description><language>az</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900" } });
}
