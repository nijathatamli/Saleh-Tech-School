import { listApplications } from "@/lib/admin/admissions";
import { handle, ok, pageParams, requireRole } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url);
  return ok(await listApplications({ q: url.searchParams.get("q")?.trim() || undefined, stage: url.searchParams.get("stage") || undefined, page, size }));
});
