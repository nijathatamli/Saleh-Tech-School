import { searchTeachers } from "@/lib/admin/classes";
import { handle, ok, requireRole } from "@/lib/api";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";

// Only accounts that are active teachers — never arbitrary users.
export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  return ok({ items: await searchTeachers((cleanQ(url.searchParams.get("q")) ?? ""), Number(url.searchParams.get("limit")) || 10) });
});
