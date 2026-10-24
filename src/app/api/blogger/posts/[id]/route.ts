import { ApiError, MSG, handle, ok, readJson, requireRole } from "@/lib/api";
import { authorOf, deleteOwnPost, getOwnPost, postSchema, updatePost } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  const u = await requireRole("BLOGGER");
  const p = await getOwnPost((await authorOf(u.id)).id, params.id);
  if (!p) throw new ApiError(404, MSG.notFound);
  return ok(p);
});

export const PATCH = handle(
  async (req, { params }) => {
    const u = await requireRole("BLOGGER");
    return ok(await updatePost((await authorOf(u.id)).id, params.id, postSchema.parse(await readJson(req))));
  },
  { mutating: true }
);

export const DELETE = handle(
  async (_req, { params }) => {
    const u = await requireRole("BLOGGER");
    await deleteOwnPost((await authorOf(u.id)).id, params.id);
    return ok({ ok: true });
  },
  { mutating: true }
);
