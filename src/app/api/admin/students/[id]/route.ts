import { getStudent, studentUpdateSchema, updateStudent } from "@/lib/admin/students";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  await requireRole("ADMIN");
  return ok(await getStudent(params.id));
});

export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const updated = await updateStudent(admin.id, params.id, studentUpdateSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(updated);
  },
  { mutating: true }
);
