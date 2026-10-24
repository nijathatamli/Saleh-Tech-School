import { listPayments } from "@/lib/admin/payments";
import { handle, ok, pageParams, requireRole } from "@/lib/api";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url);
  return ok(
    await listPayments({
      status: url.searchParams.get("status") || undefined,
      q: cleanQ(url.searchParams.get("q")),
      studentId: url.searchParams.get("studentId") || undefined,
      classId: url.searchParams.get("classId") || undefined,
      page,
      size,
    })
  );
});
