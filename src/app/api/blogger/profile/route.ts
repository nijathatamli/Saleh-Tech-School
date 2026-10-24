import { handle, ok, readJson, requireRole } from "@/lib/api";
import { authorOf, profileSchema, updateProfile } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const u = await requireRole("BLOGGER");
  return ok(await authorOf(u.id));
});

export const PATCH = handle(
  async (req) => {
    const u = await requireRole("BLOGGER");
    return ok(await updateProfile(u.id, profileSchema.parse(await readJson(req))));
  },
  { mutating: true }
);
