import { getTeacher, teacherUpdateSchema, updateTeacher } from "@/lib/admin/teachers";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  await requireRole("ADMIN");
  return ok(await getTeacher(params.id));
});

export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const t = await updateTeacher(admin.id, params.id, teacherUpdateSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(t);
  },
  { mutating: true }
);
