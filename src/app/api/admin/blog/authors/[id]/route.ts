import { handle, ok, readJson, requireRole } from "@/lib/api";
import { authorUpdateSchema, updateAuthor } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

/** [id] is the author's USER id. */
export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    await updateAuthor(admin.id, params.id, authorUpdateSchema.parse(await readJson(req)));
    return ok({ ok: true });
  },
  { mutating: true }
);
