import { convertApplication, convertSchema } from "@/lib/admin/admissions";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

// Application → student account (+ parent) → optional class, in one transaction.
export const POST = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const result = await convertApplication(admin.id, params.id, convertSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(result, 201);
  },
  { mutating: true }
);
