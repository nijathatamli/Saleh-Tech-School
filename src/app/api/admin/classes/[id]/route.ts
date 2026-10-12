import { classUpdateSchema, deleteOrArchiveClass, getClassDetail, updateClass } from "@/lib/admin/classes";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  await requireRole("ADMIN");
  return ok(await getClassDetail(params.id));
});

export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const updated = await updateClass(admin.id, params.id, classUpdateSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(updated);
  },
  { mutating: true }
);

// A class with lessons or payments is archived, never physically deleted.
export const DELETE = handle(
  async (_req, { params }) => {
    const admin = await requireRole("ADMIN");
    const result = await deleteOrArchiveClass(admin.id, params.id);
    revalidateDashboards();
    return ok(result);
  },
  { mutating: true }
);
