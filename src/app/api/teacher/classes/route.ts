import { handle, ok, requireRole } from "@/lib/api";
import { teacherClasses } from "@/lib/lessons";

export const dynamic = "force-dynamic";

// Only the signed-in teacher's own (active) classes, resolved from the session — never from a client-sent id.
export const GET = handle(async () => {
  const t = await requireRole("TEACHER");
  return ok({ items: await teacherClasses(t.id) });
});
