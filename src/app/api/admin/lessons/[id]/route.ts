import { cancelLesson, getLesson, lessonUpdateInput, rescheduleLesson } from "@/lib/schedule";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  await requireRole("ADMIN");
  return ok(await getLesson(params.id));
});

export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const lesson = await rescheduleLesson(admin.id, params.id, lessonUpdateInput.parse(await readJson(req)));
    revalidateDashboards();
    return ok(lesson);
  },
  { mutating: true }
);

// "Delete" = cancel: lessons are history, so the row stays and only leaves the calendars.
export const DELETE = handle(
  async (_req, { params }) => {
    const admin = await requireRole("ADMIN");
    const lesson = await cancelLesson(admin.id, params.id);
    revalidateDashboards();
    return ok(lesson);
  },
  { mutating: true }
);
