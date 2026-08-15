import { getCurrentParent } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  return (
    <div>
      <AppTopbar title="Ayarlar" userName={parent.user.name} userEmail={parent.user.email} />

      <div className="max-w-2xl space-y-8 p-6 md:p-10">
        <div className="flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <Avatar name={parent.user.name} size={64} />
          <div>
            <p className="font-bold text-navy-900">{parent.user.name}</p>
            <p className="text-sm text-navy-400">{parent.user.email}</p>
          </div>
        </div>

        <form action={updateProfile} className="space-y-5 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <h3 className="font-app text-base font-bold text-navy-900">Şəxsi məlumatlar</h3>
          <div>
            <Label htmlFor="name">Ad Soyad</Label>
            <Input id="name" name="name" defaultValue={parent.user.name} />
          </div>
          <div>
            <Label>Email</Label>
            <Input defaultValue={parent.user.email} disabled />
          </div>
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={parent.user.phone ?? ""} />
          </div>
          <Button type="submit" variant="app">Yadda saxla</Button>
        </form>
      </div>
    </div>
  );
}
