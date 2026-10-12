import { createStudent, listStudents, studentCreateSchema } from "@/lib/admin/students";
import { handle, ok, pageParams, readJson, requireRole, revalidateDashboards } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url);
  const active = url.searchParams.get("active");
  return ok(await listStudents({ q: url.searchParams.get("q")?.trim() || undefined, active: active === "true" ? true : active === "false" ? false : undefined, classId: url.searchParams.get("classId") || undefined, grade: Number(url.searchParams.get("grade")) || undefined, page, size }));
});

export const POST = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    const created = await createStudent(admin.id, studentCreateSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(created, 201);
  },
  { mutating: true }
);
