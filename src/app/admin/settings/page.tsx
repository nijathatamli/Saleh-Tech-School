import { AdminTopbar } from "@/components/admin/admin-topbar";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings";

import { adminGuard } from "@/lib/admin/guard";
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await adminGuard();
  const settings = await getSettings();
  return (
    <div>
      <AdminTopbar title="Tənzimləmələr" subtitle="Məktəb məlumatları, dərs və ödəniş qaydaları" />
      <div className="max-w-4xl p-6 md:p-10"><SettingsForm initial={settings} /></div>
    </div>
  );
}
