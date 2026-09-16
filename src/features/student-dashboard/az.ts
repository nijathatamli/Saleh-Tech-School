// Azerbaijani formatting for the student dashboard: everything generic comes
// from the parent portal's az.ts (dates in the school timezone, numerals,
// suffix harmony); only the helpers this design needs on top live here.
export * from "@/features/parent-dashboard/az";

export const WEEKDAYS_LONG = ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"];
/** Two-letter day tiles in the file's "Qarşıdakı dərslər" list ("ŞN" for Şənbə). */
export const WEEKDAYS_TILE = ["BZ", "BE", "ÇA", "ÇR", "CA", "CÜ", "ŞN"];

// Dative suffix by the spoken form of the last non-zero digit (or tens/hundreds).
const DATIVE_LAST: Record<number, string> = { 1: "ə", 2: "yə", 3: "ə", 4: "ə", 5: "ə", 6: "ya", 7: "yə", 8: "ə", 9: "a" };
const DATIVE_TENS: Record<number, string> = { 0: "a", 10: "a", 20: "yə", 30: "a", 40: "a", 50: "yə", 60: "a", 70: "ə", 80: "ə", 90: "a" };

/** "13-ə", "16-ya", "20-yə" ("to 13") */
export function dative(n: number) {
  const abs = Math.abs(Math.round(n));
  const last = abs % 10;
  const suffix = last ? DATIVE_LAST[last] : abs % 100 ? DATIVE_TENS[abs % 100] : abs ? "ə" : DATIVE_TENS[0];
  return `${n}-${suffix}`;
}
