import { courseUpdateSchema, getCourse, updateCourse } from "@/lib/admin/courses";
import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export const GET = handle(async (_req, { params }) => {
  await requireRole("ADMIN");
  return ok(await getCourse(params.id));
});

export const PATCH = handle(
  async (req, { params }) => {
    const admin = await requireRole("ADMIN");
    const c = await updateCourse(admin.id, params.id, courseUpdateSchema.parse(await readJson(req)));
    revalidateDashboards();
    revalidatePath("/kurslar");
    revalidatePath("/");
    return ok(c);
  },
  { mutating: true }
);
