import { setApplicationStage, stageSchema } from "@/lib/admin/admissions";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const row = await setApplicationStage(admin.id, params.id, stageSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(row);
  },
  { mutating: true }
);
