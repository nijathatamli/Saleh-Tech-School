import { createTeacher, listTeachers, teacherCreateSchema } from "@/lib/admin/teachers";
import { handle, ok, pageParams, readJson, requireRole, revalidateDashboards } from "@/lib/api";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url);
  const a = url.searchParams.get("active");
  return ok(await listTeachers({ q: cleanQ(url.searchParams.get("q")), active: a === "true" ? true : a === "false" ? false : undefined, page, size }));
});

export const POST = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    const t = await createTeacher(admin.id, teacherCreateSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(t, 201);
  },
  { mutating: true }
);
