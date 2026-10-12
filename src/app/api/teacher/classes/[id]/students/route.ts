import { handle, ok, requireRole } from "@/lib/api";
import { teacherClassProgress } from "@/lib/lessons";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  const t = await requireRole("TEACHER");
  const { class: cls, students } = await teacherClassProgress(t.id, params.id); // 403 unless this teacher teaches the class
  return ok({ class: cls, items: students });
});
