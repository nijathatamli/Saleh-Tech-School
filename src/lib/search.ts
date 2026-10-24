/**
 * The text of a `?q=` search box, made safe for the database: control characters (a NUL byte makes PostgreSQL refuse
 * the whole query with an error) become spaces and the length is capped. Empty → undefined.
 */
export function cleanQ(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 100) || undefined;
}

/** The school-year filter: a whole number 1–11, anything else means "no filter" (a huge number would overflow the database column). */
export function gradeFilter(raw: string | null | undefined): number | undefined {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 11 ? n : undefined;
}
