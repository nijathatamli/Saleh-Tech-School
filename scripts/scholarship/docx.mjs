// Minimal DOCX reader for the scholarship question files.
//
// Turns word/document.xml into a flat list of paragraphs ("blocks"). Each block
// carries a safe HTML string (escaped text, <sup>/<sub>, <br>, and MathML for Word
// equations), a plain-text rendition used for parsing, and the media files it embeds.
// Only a small, fixed set of tags is ever produced — see ALLOWED_TAGS in
// src/lib/scholarship/rich-text.ts, which the API re-applies before sending.
import { readFileSync } from "node:fs";
import JSZip from "jszip";

// ---------------------------------------------------------------- XML tree
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITIES[e.toLowerCase()];
  });
}

export function parseXml(xml) {
  const root = { name: "#root", attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(xml))) {
    const top = stack[stack.length - 1];
    if (m[6] !== undefined) {
      top.children.push({ text: decodeEntities(m[6]) });
    } else if (m[1] !== undefined && m[0].startsWith("<![CDATA[")) {
      top.children.push({ text: m[1] });
    } else if (m[3]) {
      if (m[2] === "/") {
        if (stack.length > 1) stack.pop();
      } else {
        const attrs = {};
        for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
          attrs[a[1]] = decodeEntities(a[2] ?? a[3]);
        }
        const node = { name: m[3], attrs, children: [] };
        top.children.push(node);
        if (m[5] !== "/") stack.push(node);
      }
    }
  }
  return root;
}

const kids = (n) => (n.children ?? []).filter((c) => c.name);
const kid = (n, name) => kids(n).find((c) => c.name === name);
const textOf = (n) => (n.children ?? []).map((c) => (c.text !== undefined ? c.text : textOf(c))).join("");

// ---------------------------------------------------------------- escaping
export const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------------------------------------------------------------- OMML -> MathML
const NARY_DEFAULT = "∫";
const OPERATORS = /^[+\-−×÷·∙*/=<>≤≥≠≈±∓∈∉∪∩⊂⊃⊆⊇∥⟂⊥∠°%‰′″∞∂∇→←↔⇒⇔,;:!|()[\]{}⌊⌋⌈⌉∘∝∼~‖]$/;

function mathTokens(text) {
  // Split a Word math run into MathML tokens.
  const out = [];
  const re = /(\d+(?:[.,]\d+)?)|([A-Za-zΑ-Ωα-ωƏəİıÖöÜüÇçŞşĞğ]+)|(\s+)|(.)/gu;
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) out.push(`<mn>${esc(m[1])}</mn>`);
    else if (m[2]) {
      // multi-letter runs are variable products (ab) unless they are known functions
      if (/^(sin|cos|tg|tan|ctg|cot|log|lg|ln|lim|max|min|sec|cosec|arcsin|arccos|arctg|arcctg|mod)$/i.test(m[2]))
        out.push(`<mi mathvariant="normal">${esc(m[2])}</mi>`);
      else for (const ch of m[2]) out.push(`<mi>${esc(ch)}</mi>`);
    } else if (m[3]) continue;
    else out.push(`<mo>${esc(m[4])}</mo>`);
  }
  return out.join("");
}

function mrow(parts) {
  const inner = parts.join("");
  return `<mrow>${inner}</mrow>`;
}

function omml(node) {
  const name = node.name;
  const arg = (n, k) => (kid(n, k) ? ommlChildren(kid(n, k)) : "");
  const argRow = (n, k) => mrow([arg(n, k)]);
  switch (name) {
    case "m:r": {
      const t = kids(node).filter((c) => c.name === "m:t").map(textOf).join("");
      const plain = kid(kid(node, "m:rPr") ?? { children: [] }, "m:nor") || kid(kid(node, "m:rPr") ?? { children: [] }, "m:sty")?.attrs?.["m:val"] === "p";
      if (kid(kid(node, "m:rPr") ?? { children: [] }, "m:nor")) return `<mtext>${esc(t)}</mtext>`;
      if (plain && /^[A-Za-zƏəİıÖöÜüÇçŞşĞğ ]+$/.test(t)) return `<mi mathvariant="normal">${esc(t.trim())}</mi>`;
      return mathTokens(t);
    }
    case "m:f": {
      const type = kid(kid(node, "m:fPr") ?? { children: [] }, "m:type")?.attrs?.["m:val"];
      if (type === "lin") return mrow([arg(node, "m:num"), "<mo>/</mo>", arg(node, "m:den")]);
      return `<mfrac>${argRow(node, "m:num")}${argRow(node, "m:den")}</mfrac>`;
    }
    case "m:rad": {
      const hide = kid(kid(node, "m:radPr") ?? { children: [] }, "m:degHide")?.attrs?.["m:val"];
      const deg = arg(node, "m:deg");
      if (hide === "1" || hide === "on" || !deg.trim()) return `<msqrt>${argRow(node, "m:e")}</msqrt>`;
      return `<mroot>${argRow(node, "m:e")}${mrow([deg])}</mroot>`;
    }
    case "m:sSup":
      return `<msup>${argRow(node, "m:e")}${argRow(node, "m:sup")}</msup>`;
    case "m:sSub":
      return `<msub>${argRow(node, "m:e")}${argRow(node, "m:sub")}</msub>`;
    case "m:sSubSup":
      return `<msubsup>${argRow(node, "m:e")}${argRow(node, "m:sub")}${argRow(node, "m:sup")}</msubsup>`;
    case "m:sPre":
      return `<msubsup>${argRow(node, "m:e")}${argRow(node, "m:sub")}${argRow(node, "m:sup")}</msubsup>`;
    case "m:d": {
      const pr = kid(node, "m:dPr");
      const beg = pr && kid(pr, "m:begChr") ? (kid(pr, "m:begChr").attrs["m:val"] ?? "") : "(";
      const end = pr && kid(pr, "m:endChr") ? (kid(pr, "m:endChr").attrs["m:val"] ?? "") : ")";
      const sep = pr && kid(pr, "m:sepChr") ? (kid(pr, "m:sepChr").attrs["m:val"] ?? "") : "|";
      const parts = kids(node).filter((c) => c.name === "m:e").map((e) => mrow([ommlChildren(e)]));
      const body = parts.join(sep ? `<mo>${esc(sep)}</mo>` : "");
      return `<mrow>${beg ? `<mo>${esc(beg)}</mo>` : ""}${body}${end ? `<mo>${esc(end)}</mo>` : ""}</mrow>`;
    }
    case "m:nary": {
      const pr = kid(node, "m:naryPr");
      const chr = pr && kid(pr, "m:chr") ? kid(pr, "m:chr").attrs["m:val"] : NARY_DEFAULT;
      const sub = arg(node, "m:sub");
      const sup = arg(node, "m:sup");
      const op = `<mo>${esc(chr || NARY_DEFAULT)}</mo>`;
      let head = op;
      if (sub.trim() && sup.trim()) head = `<munderover>${op}${mrow([sub])}${mrow([sup])}</munderover>`;
      else if (sub.trim()) head = `<munder>${op}${mrow([sub])}</munder>`;
      else if (sup.trim()) head = `<mover>${op}${mrow([sup])}</mover>`;
      return mrow([head, argRow(node, "m:e")]);
    }
    case "m:func":
      return mrow([mrow([arg(node, "m:fName")]), argRow(node, "m:e")]);
    case "m:limLow":
      return `<munder>${argRow(node, "m:e")}${argRow(node, "m:lim")}</munder>`;
    case "m:limUpp":
      return `<mover>${argRow(node, "m:e")}${argRow(node, "m:lim")}</mover>`;
    case "m:acc": {
      const chr = kid(kid(node, "m:accPr") ?? { children: [] }, "m:chr")?.attrs?.["m:val"] ?? "̂";
      const mark = chr === "̂" ? "^" : chr === "̄" ? "‾" : chr === "⃗" ? "→" : chr;
      return `<mover>${argRow(node, "m:e")}<mo>${esc(mark)}</mo></mover>`;
    }
    case "m:bar": {
      const pos = kid(kid(node, "m:barPr") ?? { children: [] }, "m:pos")?.attrs?.["m:val"];
      return pos === "bot" ? `<munder>${argRow(node, "m:e")}<mo>_</mo></munder>` : `<mover>${argRow(node, "m:e")}<mo>‾</mo></mover>`;
    }
    case "m:eqArr":
    case "m:m": {
      const rows = name === "m:eqArr" ? kids(node).filter((c) => c.name === "m:e").map((e) => [e]) : kids(node).filter((c) => c.name === "m:mr").map((r) => kids(r).filter((c) => c.name === "m:e"));
      const body = rows.map((cells) => `<mtr>${cells.map((c) => `<mtd>${mrow([ommlChildren(c)])}</mtd>`).join("")}</mtr>`).join("");
      return `<mtable>${body}</mtable>`;
    }
    case "m:oMath":
    case "m:oMathPara":
    case "m:e":
    case "m:num":
    case "m:den":
    case "m:sup":
    case "m:sub":
    case "m:deg":
    case "m:fName":
    case "m:lim":
    case "m:box":
    case "m:borderBox":
    case "m:phant":
    case "m:groupChr":
      return ommlChildren(node);
    default:
      // property nodes (m:*Pr, m:ctrlPr) and anything unknown produce no output
      if (/Pr$/.test(name) || name === "m:ctrlPr") return "";
      return ommlChildren(node);
  }
}

function ommlChildren(node) {
  return kids(node).map(omml).join("");
}

// A linear plain-text version of the equation (used only for parsing / alt text).
function ommlPlain(node) {
  if (node.text !== undefined) return "";
  switch (node.name) {
    case "m:t":
      return textOf(node);
    case "m:f":
      return `(${ommlPlainKids(kid(node, "m:num"))})/(${ommlPlainKids(kid(node, "m:den"))})`;
    case "m:rad":
      return `√(${ommlPlainKids(kid(node, "m:e"))})`;
    case "m:sSup":
      return `${ommlPlainKids(kid(node, "m:e"))}^${ommlPlainKids(kid(node, "m:sup"))}`;
    case "m:sSub":
      return `${ommlPlainKids(kid(node, "m:e"))}_${ommlPlainKids(kid(node, "m:sub"))}`;
    default:
      if (/Pr$/.test(node.name)) return "";
      return ommlPlainKids(node);
  }
}
const ommlPlainKids = (n) => (n ? kids(n).map(ommlPlain).join("") : "");

// ---------------------------------------------------------------- paragraphs
const SKIP = new Set(["w:pPr", "w:rPr", "w:instrText", "w:delText", "w:del", "w:proofErr", "w:bookmarkStart", "w:bookmarkEnd", "w:fldChar"]);

function paragraph(p, rels) {
  const out = { html: "", plain: "", images: [], bold: false, numbered: false, mathCount: 0 };
  const pPr = kid(p, "w:pPr");
  out.numbered = !!(pPr && kid(pPr, "w:numPr"));

  let boldRuns = 0;
  let runs = 0;

  const addText = (t, rPr) => {
    if (!t) return;
    const va = rPr && kid(rPr, "w:vertAlign")?.attrs?.["w:val"];
    const h = esc(t);
    out.plain += t;
    if (va === "superscript") out.html += `<sup>${h}</sup>`;
    else if (va === "subscript") out.html += `<sub>${h}</sub>`;
    else out.html += h;
  };

  const imageFrom = (node) => {
    // <a:blip r:embed> (DrawingML) or <v:imagedata r:id> (VML)
    const found = [];
    const walk = (n) => {
      if (n.name === "a:blip" && n.attrs["r:embed"]) found.push(n.attrs["r:embed"]);
      if (n.name === "v:imagedata" && n.attrs["r:id"]) found.push(n.attrs["r:id"]);
      (n.children ?? []).forEach((c) => c.name && walk(c));
    };
    walk(node);
    for (const id of found) {
      const target = rels[id];
      if (target && !out.images.includes(target)) {
        out.images.push(target);
        out.html += `<!--img:${target}-->`;
        out.plain += " ";
      }
    }
  };

  const walkRun = (r) => {
    runs++;
    const rPr = kid(r, "w:rPr");
    if (rPr && kid(rPr, "w:b") && !["0", "false"].includes(kid(rPr, "w:b").attrs["w:val"])) boldRuns++;
    for (const c of kids(r)) {
      switch (c.name) {
        case "w:t":
          addText(textOf(c), rPr);
          break;
        case "w:tab":
          out.html += " ";
          out.plain += " ";
          break;
        case "w:br":
        case "w:cr":
          if (c.attrs["w:type"] !== "page") {
            out.html += "<br>";
            out.plain += "\n";
          }
          break;
        case "w:drawing":
        case "w:pict":
        case "w:object":
          imageFrom(c);
          break;
        case "mc:AlternateContent": {
          const choice = kid(c, "mc:Choice") ?? kid(c, "mc:Fallback");
          if (choice) imageFrom(choice);
          break;
        }
        default:
          break;
      }
    }
  };

  const walk = (n) => {
    for (const c of kids(n)) {
      if (SKIP.has(c.name)) continue;
      if (c.name === "w:r") walkRun(c);
      else if (c.name === "m:oMath" || c.name === "m:oMathPara") {
        const inner = omml(c);
        if (inner.trim()) {
          out.html += `<math>${inner}</math>`;
          out.plain += ommlPlain(c);
          out.mathCount++;
        }
      } else if (c.name === "mc:AlternateContent") {
        const choice = kid(c, "mc:Choice") ?? kid(c, "mc:Fallback");
        if (choice) walk(choice);
      } else walk(c); // w:hyperlink, w:ins, w:smartTag, w:sdt, w:sdtContent, ...
    }
  };
  walk(p);

  out.bold = runs > 0 && boldRuns / runs >= 0.5;
  // collapse nbsp / odd whitespace in plain text only
  out.plain = out.plain.replace(/[    ]/g, " ");
  out.html = out.html.replace(/[    ]/g, " ");
  return out;
}

export async function readDocx(path) {
  const zip = await JSZip.loadAsync(readFileSync(path));
  const docXml = await zip.file("word/document.xml").async("string");
  const relsXml = await zip.file("word/_rels/document.xml.rels").async("string");
  const rels = {};
  for (const r of kids(kid(parseXml(relsXml), "Relationships"))) {
    if (/image/.test(r.attrs.Type ?? "")) rels[r.attrs.Id] = r.attrs.Target.replace(/^\/?(word\/)?/, "");
  }
  const doc = parseXml(docXml);
  const body = kid(kid(doc, "w:document"), "w:body");

  const blocks = [];
  const walkBody = (n, inTable) => {
    for (const c of kids(n)) {
      if (c.name === "w:p") {
        const p = paragraph(c, rels);
        p.inTable = inTable;
        blocks.push(p);
      } else if (c.name === "w:tbl") {
        for (const tr of kids(c).filter((x) => x.name === "w:tr")) {
          const cells = kids(tr).filter((x) => x.name === "w:tc");
          const row = cells.map((tc) => kids(tc).filter((x) => x.name === "w:p").map((pp) => paragraph(pp, rels).plain.trim()).join(" ").trim());
          blocks.push({ html: "", plain: row.join("\t"), images: [], bold: false, numbered: false, mathCount: 0, row, inTable: true });
        }
      } else if (c.name === "w:sdt" || c.name === "w:sdtContent") walkBody(c, inTable);
    }
  };
  walkBody(body, false);

  const media = {};
  for (const target of new Set(Object.values(rels))) {
    const f = zip.file(`word/${target}`);
    if (f) media[target] = await f.async("nodebuffer");
  }
  return { blocks, media };
}
