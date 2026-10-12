import { z } from "zod";
import { handle, ok, pageParams, readJson, requireRole, revalidateDashboards } from "@/lib/api";
import { lessonCreateInput, listLessons, scheduleLesson } from "@/lib/schedule";
import { fromBakuLocal } from "@/features/parent-dashboard/az";

export const dynamic = "force-dynamic";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url, { size: 50, max: 200 });
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  return ok(
    await listLessons({
      from: from && day.safeParse(from).success ? fromBakuLocal(`${from}T00:00`) : undefined,
      to: to && day.safeParse(to).success ? new Date(fromBakuLocal(`${to}T00:00`).getTime() + 86_400_000) : undefined,
      classId: url.searchParams.get("classId") || undefined,
      teacherId: url.searchParams.get("teacherId") || undefined,
      status: url.searchParams.get("status") || undefined,
      page,
      size,
    })
  );
});

export const POST = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    const lesson = await scheduleLesson(admin.id, lessonCreateInput.parse(await readJson(req)));
    revalidateDashboards();
    return ok(lesson, lesson.created ? 201 : 200);
  },
  { mutating: true }
);
