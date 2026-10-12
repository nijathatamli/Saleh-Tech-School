import { handle, ok, readJson, requireRole, revalidateDashboards } from "@/lib/api";
import { getSettings, settingsSchema, updateSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireRole("ADMIN");
  return ok(await getSettings());
});

export const PUT = handle(
  async (req) => {
    const admin = await requireRole("ADMIN");
    const saved = await updateSettings(admin.id, settingsSchema.parse(await readJson(req)));
    revalidateDashboards();
    return ok(saved);
  },
  { mutating: true }
);
