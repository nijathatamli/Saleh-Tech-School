import { handle, ok, readJson, requireRole } from "@/lib/api";
import { authorCreateSchema, createAuthor } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export const POST = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    return ok(await createAuthor(admin.id, authorCreateSchema.parse(await readJson(req))), 201);
  },
  { mutating: true }
);
