import { getCurrentStudent } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { LanguageSwitcher } from "@/components/dash/language-switcher";
import { DashThemeToggle } from "@/components/dash/theme-toggle";
import { getServerDictionary, topbarLabels } from "@/i18n/server";
import { StudentAvatarUpload } from "./avatar-upload";

export const dynamic = "force-dynamic";

export default async function StudentSettingsPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const { locale, dict } = getServerDictionary();
  const name = student.user?.name ?? `${student.firstName} ${student.lastName}`;

  return (
    <div>
      <DashTopbar
        title={dict.settings.title}
        userName={name}
        userEmail={student.user?.email ?? ""}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/student/settings"
        showMobileMenuTrigger={false}
      />

      <div className="max-w-2xl space-y-6 p-6 md:p-10">
        <DashCard>
          <h3 className="mb-4 font-display text-base text-dash-ink dark:text-white">{dict.settings.avatarTitle}</h3>
          <StudentAvatarUpload name={name} initialUrl={student.avatarUrl} label={dict.settings.avatarChange} />
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
      </div>
    </div>
  );
}
