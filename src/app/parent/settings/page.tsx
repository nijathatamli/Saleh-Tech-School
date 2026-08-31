import { getCurrentParent } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/dash/language-switcher";
import { DashThemeToggle } from "@/components/dash/theme-toggle";
import { getServerDictionary, topbarLabels } from "@/i18n/server";
import { updateProfile } from "./actions";
import { AvatarUpload } from "./avatar-upload";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { locale, dict } = getServerDictionary();

  return (
    <div>
      <DashTopbar
        title={dict.settings.title}
        userName={parent.user.name}
        userEmail={parent.user.email}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/parent/settings"
        showMobileMenuTrigger={false}
      />

      <div className="max-w-2xl space-y-6 p-6 md:p-10">
        <DashCard>
          <h3 className="mb-4 font-display text-base text-dash-ink dark:text-white">{dict.settings.avatarTitle}</h3>
          <AvatarUpload name={parent.user.name} initialUrl={parent.user.avatarUrl} label={dict.settings.avatarChange} />
        </DashCard>

        <DashCard className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base text-dash-ink dark:text-white">{dict.settings.appearanceTitle}</h3>
            <p className="mt-1 text-sm text-dash-ink/50 dark:text-white/45">{dict.settings.appearanceDesc}</p>
          </div>
          <DashThemeToggle light={dict.common.light} dark={dict.common.dark} />
        </DashCard>

        <DashCard className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base text-dash-ink dark:text-white">{dict.settings.languageTitle}</h3>
            <p className="mt-1 text-sm text-dash-ink/50 dark:text-white/45">{dict.settings.languageDesc}</p>
          </div>
          <LanguageSwitcher locale={locale} label={dict.languageSwitcher.label} />
        </DashCard>

        <form action={updateProfile}>
          <DashCard className="space-y-5">
            <h3 className="font-display text-base text-dash-ink dark:text-white">{dict.settings.personalInfoTitle}</h3>
            <div>
              <Label htmlFor="name">{dict.settings.fullName}</Label>
              <Input id="name" name="name" defaultValue={parent.user.name} />
            </div>
            <div>
              <Label>{dict.settings.email}</Label>
              <Input defaultValue={parent.user.email} disabled />
            </div>
            <div>
              <Label htmlFor="phone">{dict.settings.phone}</Label>
              <Input id="phone" name="phone" defaultValue={parent.user.phone ?? ""} />
            </div>
            <Button type="submit" variant="app">{dict.settings.save}</Button>
          </DashCard>
        </form>
      </div>
    </div>
  );
}
