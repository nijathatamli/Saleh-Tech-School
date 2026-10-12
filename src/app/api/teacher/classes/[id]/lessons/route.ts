import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";
import { createLessonFor, lessonCreateSchema } from "@/lib/lessons";

export const dynamic = "force-dynamic";

export const POST = handle(
  async (req, { params }) => {
    const t = await requireRole("TEACHER");
    const { date } = lessonCreateSchema.parse(await readJson(req));
    const lesson = await createLessonFor(t.id, params.id, date);
    revalidateDashboards();
    return ok(lesson, lesson.created ? 201 : 200);
  },
  { mutating: true }
);
