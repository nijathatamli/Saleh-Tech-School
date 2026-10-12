import { z } from "zod";
import { setClassTeacher } from "@/lib/admin/classes";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

const body = z.object({ teacherId: z.string({ required_error: "Müəllim seçin." }).min(1, "Müəllim seçin.") });

export const PUT = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const { teacherId } = body.parse(await readJson(req));
    const detail = await setClassTeacher(admin.id, params.id, teacherId);
    revalidateDashboards();
    return ok(detail);
  },
  { mutating: true }
);
