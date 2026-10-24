// Azerbaijani date/number formatting for the parent portal. Hand-rolled tables
// instead of Intl locale data so the server and every browser produce the exact
// same strings (no hydration mismatches, no missing az-AZ ICU in some builds).
// All calendar math is done in the school's timezone.

export const TIME_ZONE = "Asia/Baku";

export const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
export const MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];
const WEEKDAYS = ["Bazar", "Bazar ertəsi", "Çərşənbə axşamı", "Çərşənbə", "Cümə axşamı", "Cümə", "Şənbə"];
// month + locative ("Avqustda"); only Aprel takes the front-vowel form
const MONTHS_LOC = MONTHS.map((m) => (m === "Aprel" ? `${m}də` : `${m}da`));
const COUNT_WORDS = ["", "Bir", "İki", "Üç", "Dörd", "Beş", "Altı", "Yeddi", "Səkkiz", "Doqquz", "On"];

export type Parts = { y: number; m: number; d: number; h: number; min: number; wd: number };

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
  hour12: false,
});
const WD_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function parts(input: Date | string | number): Parts {
  const date = input instanceof Date ? input : new Date(input);
  const p: Record<string, string> = {};
  for (const part of partsFmt.formatToParts(date)) p[part.type] = part.value;
  return {
    y: Number(p.year),
    m: Number(p.month) - 1,
    d: Number(p.day),
    h: Number(p.hour) % 24,
    min: Number(p.minute),
    wd: WD_INDEX[p.weekday] ?? 0,
  };
}

export function dayKey(p: Parts) {
  return p.y * 10000 + p.m * 100 + p.d;
}

/** Whole-day distance (in the school timezone) from `from` to `to`, negative when `to` is earlier. */
export function dayDiff(from: Parts, to: Parts) {
  const a = Date.UTC(from.y, from.m, from.d);
  const b = Date.UTC(to.y, to.m, to.d);
  return Math.round((b - a) / 86400000);
}

export function twoDigits(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

/** "6 Sentyabr" */
export function dayMonth(p: Parts) {
  return `${p.d} ${MONTHS[p.m]}`;
}

/** "8 Avq" */
export function dayMonthShort(p: Parts) {
  return `${p.d} ${MONTHS_SHORT[p.m]}`;
}

/** "30 Avq 2026" */
export function dayMonthShortYear(p: Parts) {
  return `${p.d} ${MONTHS_SHORT[p.m]} ${p.y}`;
}

/** "6 Sentyabr, Şənbə" */
export function longDate(p: Parts) {
  return `${p.d} ${MONTHS[p.m]}, ${WEEKDAYS[p.wd]}`;
}

/** "18:00" */
export function clock(p: Parts) {
  return `${twoDigits(p.h)}:${twoDigits(p.min)}`;
}

/** "Avqustda" */
export function monthLocative(m: number) {
  return MONTHS_LOC[m];
}

/** "Altı" for 6 (falls back to digits beyond ten). */
export function countWord(n: number) {
  return COUNT_WORDS[n] ?? String(n);
}

/** "1 240" — the file separates thousands with a plain space. */
export function groupNumber(n: number) {
  const sign = n < 0 ? "-" : "";
  const digits = String(Math.abs(Math.round(n)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Suffix harmony for numerals, keyed by the spoken form of the last non-zero
// digit (or tens/hundreds when the number ends in zero).
type SuffixSet = { ord: string; loc: string; poss: string };
const BY_LAST_DIGIT: Record<number, SuffixSet> = {
  1: { ord: "ci", loc: "ində", poss: "i" }, // bir
  2: { ord: "ci", loc: "sində", poss: "si" }, // iki
  3: { ord: "cü", loc: "ündə", poss: "ü" }, // üç
  4: { ord: "cü", loc: "ündə", poss: "ü" }, // dörd
  5: { ord: "ci", loc: "ində", poss: "i" }, // beş
  6: { ord: "cı", loc: "sında", poss: "sı" }, // altı
  7: { ord: "ci", loc: "sində", poss: "si" }, // yeddi
  8: { ord: "ci", loc: "ində", poss: "i" }, // səkkiz
  9: { ord: "cu", loc: "unda", poss: "u" }, // doqquz
};
const BY_TENS: Record<number, SuffixSet> = {
  0: { ord: "cı", loc: "ında", poss: "ı" }, // sıfır
  10: { ord: "cu", loc: "unda", poss: "u" }, // on
  20: { ord: "ci", loc: "sində", poss: "si" }, // iyirmi
  30: { ord: "cu", loc: "unda", poss: "u" }, // otuz
  40: { ord: "cı", loc: "ında", poss: "ı" }, // qırx
  50: { ord: "ci", loc: "sində", poss: "si" }, // əlli
  60: { ord: "cı", loc: "ında", poss: "ı" }, // altmış
  70: { ord: "ci", loc: "ində", poss: "i" }, // yetmiş
  80: { ord: "ci", loc: "ində", poss: "i" }, // səksən
  90: { ord: "cı", loc: "ında", poss: "ı" }, // doxsan
};
const HUNDRED: SuffixSet = { ord: "cü", loc: "ündə", poss: "ü" }; // yüz

function suffixSet(n: number): SuffixSet {
  const abs = Math.abs(Math.round(n));
  const last = abs % 10;
  if (last) return BY_LAST_DIGIT[last];
  const tens = abs % 100;
  if (tens) return BY_TENS[tens];
  if (abs) return HUNDRED;
  return BY_TENS[0];
}

/** "2-ci", "3-cü", "6-cı" */
export function ordinal(n: number) {
  return `${n}-${suffixSet(n).ord}`;
}

/** "23-ündə", "25-ində" ("in 23 of them") */
export function locativePossessive(n: number) {
  return `${n}-${suffixSet(n).loc}`;
}

/** "23-ü", "25-i" */
export function possessive(n: number) {
  return `${n}-${suffixSet(n).poss}`;
}

export function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .replace(/i/g, "İ") // dotted i, without relying on locale-aware casing
    .toUpperCase();
}

/**
 * Strict version of fromBakuLocal for text that comes from a person or a URL: "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" in Baku time,
 * or null when that calendar date/time does not exist (30 February, 25:61, month 13, year 0001) — it never rolls over to another day.
 */
export function parseBakuLocal(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2})?)?$/.exec(value);
  if (!m) return null;
  const [y, mo, d, h, mi] = [m[1], m[2], m[3], m[4] ?? "0", m[5] ?? "0"].map(Number);
  const probe = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d || probe.getUTCHours() !== h || probe.getUTCMinutes() !== mi) return null;
  return fromBakuLocal(m[4] === undefined ? `${value}T00:00` : value);
}

/** True for a real calendar day "YYYY-MM-DD" in 2000–2100 (outside that range a "+1 day" end bound would leave the database's date range). */
export const isRealDay = (value: string) => value.length === 10 && parseBakuLocal(value) !== null && Number(value.slice(0, 4)) >= 2000 && Number(value.slice(0, 4)) <= 2100;

/** A `datetime-local` value typed in Baku time ("2026-09-20T18:00") as an instant. Azerbaijan has no DST. */
export function fromBakuLocal(value: string) {
  return new Date(`${value.length === 16 ? `${value}:00` : value}+04:00`);
}
