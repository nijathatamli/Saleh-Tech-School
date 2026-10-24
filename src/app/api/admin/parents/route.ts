import { createParent, parentCreateSchema, searchParentsLite } from "@/lib/admin/parents";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";

// picker search (small payload with a children COUNT)
export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  return ok({ items: await searchParentsLite((cleanQ(url.searchParams.get("q")) ?? ""), Number(url.searchParams.get("limit")) || 10) });
});

export const POST = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    const p = await createParent(admin.id, parentCreateSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(p, 201);
  },
  { mutating: true }
);
