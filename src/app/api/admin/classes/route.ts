import { classCreateSchema, createClass, listClasses } from "@/lib/admin/classes";
import { handle, ok, pageParams, readJson, requireRole, revalidateDashboards } from "@/lib/api";
import { cleanQ } from "@/lib/search";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireRole("ADMIN");
  const url = new URL(req.url);
  const { page, size } = pageParams(url);
  const status = url.searchParams.get("status");
  const sort = url.searchParams.get("sort");
  return ok(
    await listClasses({
      q: cleanQ(url.searchParams.get("q")),
      status: status === "ARCHIVED" || status === "ALL" ? status : "ACTIVE",
      teacherId: url.searchParams.get("teacherId") || undefined,
      sort: sort === "created" || sort === "students" ? sort : "name",
      dir: url.searchParams.get("dir") === "desc" ? "desc" : "asc",
      page,
      size,
    })
  );
});

export const POST = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    const input = classCreateSchema.parse(await readJson(req));
    const created = await createClass(admin.id, input);
    revalidateDashboards();
    return ok(created, 201);
  },
  { mutating: true }
);
