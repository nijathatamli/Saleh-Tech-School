import { removeClassStudent } from "@/lib/admin/classes";
import { handle, ok, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

// Removes the membership only; the student account and its history stay.
export const DELETE = handle(
  async (_req, { params }) => {
    const admin = await requireRole("ADMIN");
    const detail = await removeClassStudent(admin.id, params.id, params.studentId);
    revalidateDashboards();
    return ok(detail);
  },
  { mutating: true }
);
