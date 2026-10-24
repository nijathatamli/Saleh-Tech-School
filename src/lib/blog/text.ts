// Pure text helpers for the blog (no database, usable in server and client code).

const MAP: Record<string, string> = { ə: "e", Ə: "e", ı: "i", İ: "i", I: "i", ö: "o", Ö: "o", ü: "u", Ü: "u", ç: "c", Ç: "c", ş: "s", Ş: "s", ğ: "g", Ğ: "g" };

/** URL slug: Azerbaijani letters transliterated, lower case, words joined by "-". */
export function slugify(input: string, max = 80): string {
  const s = input
    .replace(/[əƏıİIöÖüÜçÇşŞğĞ]/g, (c) => MAP[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, max).replace(/-+$/g, "");
}

/** Markdown → plain text (for excerpts, reading time and word counts). */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const wordCount = (md: string) => (stripMarkdown(md).match(/\S+/g) ?? []).length;

/** ~200 words a minute, at least one. */
export const readingMinutes = (md: string) => Math.max(1, Math.round(wordCount(md) / 200));

/** First ~160 characters of the text, cut at a word. */
export function autoExcerpt(md: string, max = 160): string {
  const t = stripMarkdown(md);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 25)).replace(/[\s,;:.–-]+$/, "")}…`;
}

export type Heading = { level: 2 | 3; text: string; id: string };

/** h2/h3 of a Markdown body, with the same ids the renderer puts on the headings. */
export function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  const used = new Map<string, number>();
  let inCode = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) inCode = !inCode;
    if (inCode) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[*_`]/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    out.push({ level: m[1].length as 2 | 3, text, id: uniqueId(text, used) });
  }
  return out;
}

export function uniqueId(text: string, used: Map<string, number>): string {
  const base = slugify(text, 60) || "bolme";
  const n = used.get(base) ?? 0;
  used.set(base, n + 1);
  return n === 0 ? base : `${base}-${n + 1}`;
}

export const formatBlogDate = (d: Date | string) =>
  new Intl.DateTimeFormat("az-AZ", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Baku" }).format(new Date(d));
