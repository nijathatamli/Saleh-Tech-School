import type { CSSProperties } from "react";

// The template's logic builds inline styles as CSS strings ("a:b;c:d"), exactly
// as parent-dashboard.html does. React needs objects, so convert at render time
// (memoised — the same strings are produced on every render).
const cache = new Map<string, CSSProperties>();

function camel(prop: string) {
  if (prop.startsWith("--")) return prop;
  const vendor = prop.startsWith("-"); // -webkit-x -> WebkitX (React's vendor-prefix form)
  const out = prop.replace(/^-/, "").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return vendor ? out[0].toUpperCase() + out.slice(1) : out;
}

export function sx(css: string | undefined | null): CSSProperties | undefined {
  if (!css) return undefined;
  const hit = cache.get(css);
  if (hit) return hit;

  const style: Record<string, string> = {};
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  const flush = () => {
    const i = cur.indexOf(":");
    if (i > 0) style[camel(cur.slice(0, i).trim())] = cur.slice(i + 1).trim();
    cur = "";
  };
  for (const ch of css) {
    if (quote) {
      if (ch === quote) quote = null;
      cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === ";" && depth === 0) {
      flush();
      continue;
    }
    cur += ch;
  }
  flush();

  cache.set(css, style as CSSProperties);
  return style as CSSProperties;
}
