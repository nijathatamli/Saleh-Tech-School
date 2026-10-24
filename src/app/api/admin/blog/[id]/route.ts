import { handle, ok, readJson, requireRole } from "@/lib/api";
import { deletePostAdmin, moderatePost, moderateSchema } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    return ok(await moderatePost(admin.id, params.id, moderateSchema.parse(await readJson(req))));
  },
  { mutating: true }
);

export const DELETE = handle(
  async (_req, { params }) => {
    const admin = await requireRole("ADMIN");
    await deletePostAdmin(admin.id, params.id);
    return ok({ ok: true });
  },
  { mutating: true }
);
