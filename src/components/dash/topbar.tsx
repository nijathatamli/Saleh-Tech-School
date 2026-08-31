import type { Locale } from "@/i18n/locales";

/**
 * In-content page header (title + optional subtitle). The persistent brand/utility
 * bar lives in DashHeader now (rendered once per role layout), so this component only
 * owns the per-page title block — it still accepts the old prop shape so every existing
 * call site keeps working unchanged.
 */
export function DashTopbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  userName?: string;
  userEmail?: string;
  unreadNotifications?: number;
  notificationsHref?: string;
  locale?: Locale;
  labels?: { language: string; profile: string; settings: string; logout: string; light: string; dark: string };
  settingsHref?: string;
  showLanguageSwitcher?: boolean;
  showMobileMenuTrigger?: boolean;
}) {
  return (
    <div className="sticky top-0 z-20 border-b border-dash-rule bg-dash-paper px-6 pb-6 pt-8 dark:border-dash-dark-rule dark:bg-dash-dark-bg md:px-10">
      <h1 className="font-display text-xl text-dash-ink dark:text-white md:text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-dash-ink/45 dark:text-white/40">{subtitle}</p>}
    </div>
  );
}
