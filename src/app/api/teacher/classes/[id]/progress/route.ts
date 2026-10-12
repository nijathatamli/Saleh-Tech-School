import { handle, ok, requireRole } from "@/lib/api";
import { teacherClassProgress } from "@/lib/lessons";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  const t = await requireRole("TEACHER");
  return ok(await teacherClassProgress(t.id, params.id));
});
