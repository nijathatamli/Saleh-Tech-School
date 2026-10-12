import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";
import { completeLesson, completeSchema } from "@/lib/lessons";

export const dynamic = "force-dynamic";

// Dərsi tamamlandı — idempotent; opens a payment cycle (and notifies admins) when the threshold is reached.
export const POST = handle(
  async (req, { params }) => {
    const t = await requireRole("TEACHER");
    const { studentIds } = completeSchema.parse(await readJson(req));
    const results = await completeLesson(t.id, params.lessonId, studentIds);
    revalidateDashboards();
    return ok({ items: results });
  },
  { mutating: true }
);
