import { getReports } from "@/lib/admin/reports";
import { handle, ok, requireRole } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  return ok(await getReports(url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined));
});
