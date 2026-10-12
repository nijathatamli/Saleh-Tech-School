import { courseCreateSchema, createCourse, listAdminCourses } from "@/lib/admin/courses";
import { handle, ok, pageParams, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

// default = active courses (what the pickers need); ?active=all|false for the management list
export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url, { size: 50, max: 200 });
  const a = url.searchParams.get("active");
  return ok(await listAdminCourses({ q: url.searchParams.get("q")?.trim() || undefined, active: a === "all" ? undefined : a === "false" ? false : true, page, size }));
});

export const POST = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    const c = await createCourse(admin.id, courseCreateSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(c, 201);
  },
  { mutating: true }
);
