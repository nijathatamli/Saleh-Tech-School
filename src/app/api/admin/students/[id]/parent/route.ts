import { moveStudentSchema, moveStudentToParent } from "@/lib/admin/parents";
import { getStudent } from "@/lib/admin/students";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

// Change which parent a student belongs to; the student's payments move with them.
export const PUT = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const { parentId } = moveStudentSchema.parse(await readJson(req));
    await moveStudentToParent(admin.id, params.id, parentId);
    revalidateDashboards();
    return ok(await getStudent(params.id));
  },
  { mutating: true }
);
