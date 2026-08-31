import { az } from "./dictionaries/az";
import { en } from "./dictionaries/en";
import { ru } from "./dictionaries/ru";
import { tr } from "./dictionaries/tr";
import type { Locale } from "./locales";

export * from "./locales";
export type { Dictionary } from "./dictionaries/az";

const dictionaries = { az, en, ru, tr };

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
