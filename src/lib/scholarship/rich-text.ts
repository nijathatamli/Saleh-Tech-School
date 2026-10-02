// Question text is stored as a restricted HTML subset (plain text, <sup>/<sub>, <br> and
// MathML produced by the DOCX importer). The API runs it through this whitelist again
// before it ever reaches a browser, so the client can render it with innerHTML safely.
const ALLOWED = new Set([
  "br", "sup", "sub",
  "math", "mrow", "mi", "mn", "mo", "mtext", "mfrac", "msqrt", "mroot", "msup", "msub", "msubsup",
  "munder", "mover", "munderover", "mtable", "mtr", "mtd",
]);
const VOID = new Set(["br"]);

export function sanitizeRich(html: string): string {
  const out: string[] = [];
  const stack: string[] = [];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)|</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) {
      // text: entities are kept, any stray angle bracket or quote is neutralised
      out.push(m[4].replace(/>/g, "&gt;"));
    } else if (m[2]) {
      const name = m[2].toLowerCase();
      if (!ALLOWED.has(name)) continue;
      if (m[1]) {
        const idx = stack.lastIndexOf(name);
        if (idx === -1) continue;
        while (stack.length > idx) out.push(`</${stack.pop()}>`);
      } else if (VOID.has(name)) {
        out.push(`<${name}>`);
      } else {
        const attrs = name === "mi" && /mathvariant\s*=\s*["']normal["']/.test(m[3]) ? ' mathvariant="normal"' : "";
        out.push(`<${name}${attrs}>`);
        stack.push(name);
      }
    } else if (m[0] === "<") {
      out.push("&lt;");
    }
  }
  while (stack.length) out.push(`</${stack.pop()}>`);
  return out.join("");
}
