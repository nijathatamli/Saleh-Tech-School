import { searchStudents } from "@/lib/admin/students";
import { handle, ok, requireRole } from "@/lib/api";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";

// Typeahead for the class pickers: database query, hard limit, nothing is filtered in the browser.
export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const limit = Math.min(25, Math.max(1, Number(url.searchParams.get("limit")) || 10));
  const items = await searchStudents({ q: (cleanQ(url.searchParams.get("q")) ?? ""), limit, excludeClassId: url.searchParams.get("excludeClassId") || undefined });
  return ok({ items });
});
