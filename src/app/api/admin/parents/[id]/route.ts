import { getParent, parentUpdateSchema, updateParent } from "@/lib/admin/parents";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  await requireRole("ADMIN");
  return ok(await getParent(params.id));
});

export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const p = await updateParent(admin.id, params.id, parentUpdateSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(p);
  },
  { mutating: true }
);
