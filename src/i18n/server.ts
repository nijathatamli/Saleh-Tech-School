import { cookies } from "next/headers";
import { getDictionary } from "./index";
import { defaultLocale, isLocale, type Locale } from "./locales";
import type { Dictionary } from "./dictionaries/az";

const COOKIE_NAME = "locale";

export function getLocale(): Locale {
  const value = cookies().get(COOKIE_NAME)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export function getServerDictionary() {
  const locale = getLocale();
  return { locale, dict: getDictionary(locale) };
}

/** Shared label bundle every DashTopbar instance needs. */
export function topbarLabels(dict: Dictionary) {
  return {
    language: dict.languageSwitcher.label,
    profile: dict.topbar.profile,
    settings: dict.topbar.settings,
    logout: dict.topbar.logout,
    light: dict.common.light,
    dark: dict.common.dark,
  };
}

export { COOKIE_NAME as LOCALE_COOKIE_NAME };
