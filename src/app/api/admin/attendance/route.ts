import { handle, ok, pageParams, requireRole } from "@/lib/api";
import { listAttendance } from "@/lib/admin/attendance";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url, { size: 50, max: 200 });
  return ok(
    await listAttendance({
      classId: url.searchParams.get("classId") || undefined,
      studentId: url.searchParams.get("studentId") || undefined,
      status: url.searchParams.get("status") || undefined,
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
      page,
      size,
    })
  );
});
