import { handle, ok, requireRole } from "@/lib/api";
import { studentClasses } from "@/lib/lessons";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const s = await requireRole("STUDENT");
  return ok({ items: await studentClasses(s.id) });
});
