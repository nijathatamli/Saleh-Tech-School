import { z } from "zod";
import { addClassStudents } from "@/lib/admin/classes";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

const body = z.object({ studentIds: z.array(z.string().min(1)).min(1, "Ən azı bir tələbə seçin.").max(300) });

export const POST = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const { studentIds } = body.parse(await readJson(req));
    const result = await addClassStudents(admin.id, params.id, studentIds);
    revalidateDashboards();
    return ok(result, 201);
  },
  { mutating: true }
);
