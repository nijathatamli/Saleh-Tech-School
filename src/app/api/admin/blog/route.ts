import { handle, ok, pageParams, requireRole } from "@/lib/api";
import { listAllPosts, listAuthors } from "@/lib/blog/posts";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url, { size: 20, max: 100 });
  const s = url.searchParams.get("status");
  const posts = await listAllPosts({ q: cleanQ(url.searchParams.get("q")), status: s === "DRAFT" || s === "PUBLISHED" ? s : undefined, page, size });
  return ok({ ...posts, authors: await listAuthors() });
});
