import { handle, ok, pageParams, readJson, requireRole } from "@/lib/api";
import { authorOf, createPost, listOwnPosts, postSchema } from "@/lib/blog/posts";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const u = await requireRole("BLOGGER");
  const url = new URL(req.url);
  const { page, size } = pageParams(url, { size: 20, max: 100 });
  const s = url.searchParams.get("status");
  return ok(await listOwnPosts((await authorOf(u.id)).id, { q: cleanQ(url.searchParams.get("q")), status: s === "DRAFT" || s === "PUBLISHED" ? s : undefined, page, size }));
});

export const POST = handle(
  async (req) => {
    const u = await requireRole("BLOGGER");
    const post = await createPost((await authorOf(u.id)).id, postSchema.parse(await readJson(req)));
    return ok(post, 201);
  },
  { mutating: true }
);
