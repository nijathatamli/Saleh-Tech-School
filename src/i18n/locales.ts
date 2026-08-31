export const locales = ["az", "en", "ru", "tr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "az";

export const localeMeta: Record<Locale, { nativeName: string; flag: string }> = {
  az: { nativeName: "Azərbaycan", flag: "🇦🇿" },
  en: { nativeName: "English", flag: "🇬🇧" },
  ru: { nativeName: "Русский", flag: "🇷🇺" },
  tr: { nativeName: "Türkçe", flag: "🇹🇷" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function format(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}
