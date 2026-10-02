// DOCX -> JSON question bank for the scholarship exam.
//
//   node scripts/scholarship/parse-questions.mjs
//
// Scans ./questions for "<grades> SİNİFLƏR*.docx", derives one category per file from
// the file name (e.g. "1-2 SİNİFLƏR (1).docx" -> key "1-2", label "1–2-ci sinif"),
// extracts the questions, options, images and answer keys, and writes:
//
//   prisma/scholarship/questions.json   the question bank (reviewed, committed)
//   prisma/scholarship/media/<id>.png   images referenced by questions
//
// scripts/scholarship-sync.mjs then loads that bank into the database (idempotent), so
// the DOCX files are parsed once, never on a student request.
import { readdirSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { readDocx } from "./docx.mjs";
import { OVERRIDES } from "./overrides.mjs";
import { fromTemplate, numbersIn, placeholders, toTemplate } from "./templates.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const QUESTIONS_DIR = join(ROOT, "questions");
const OUT_DIR = join(ROOT, "prisma/scholarship");

// ------------------------------------------------------------------ helpers
const fold = (s) =>
  s
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/ə/g, "e")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/[^a-z0-9]/g, "");

// Azerbaijani ordinal suffix, chosen by the vowel of the last spoken number word.
const ORDINAL = { 1: "ci", 2: "ci", 3: "cü", 4: "cü", 5: "ci", 6: "cı", 7: "ci", 8: "ci", 9: "cu", 10: "cu", 11: "ci" };
export function categoryFromFile(name) {
  const m = name.normalize("NFC").match(/^\s*(\d{1,2})(?:\s*-\s*(\d{1,2}))?\s*S[İI]N[İI]FL[ƏE]R/i);
  if (!m) return null;
  const from = Number(m[1]);
  const to = m[2] ? Number(m[2]) : from;
  const key = from === to ? String(from) : `${from}-${to}`;
  const label = from === to ? `${from}-${ORDINAL[from]} sinif` : `${from}–${to}-${ORDINAL[to]} sinif`;
  return { key, label, grades: [from, to], sortOrder: from };
}

const SECTION_BY_FOLD = {
  ingilisdili: { subject: "ENGLISH", part: 1 },
  ingilis: { subject: "ENGLISH", part: 1 },
  riyaziyyat: { subject: "MATH", part: 1 },
  riyaziyyat1: { subject: "MATH", part: 1 },
  riyaziyyat2: { subject: "MATH", part: 2 },
  mentiq: { subject: "LOGIC", part: 1 },
};
const sectionKey = (s) => `${s.subject}:${s.part}`;
const isKeyMarker = (plain) => ["cavablar", "cavabacari"].includes(fold(plain.trim()));

// Replaces tags and whole <math> blocks with \u0001 so option markers inside equations are
// never matched while string indices stay aligned with the original HTML.
function mask(html) {
  return html
    .replace(/<math>[\s\S]*?<\/math>/g, (m) => "\u0001".repeat(m.length))
    .replace(/<[^>]*>/g, (m) => "\u0001".repeat(m.length));
}

function findOptionChain(html) {
  const masked = mask(html);
  const cands = [];
  for (const m of masked.matchAll(/(?<![A-Z0-9])([A-E])\)/g)) cands.push({ letter: m[1], idx: m.index, end: m.index + 2 });
  const order = "ABCDE";
  let best = null;
  for (let i = cands.length - 1; i >= 0; i--) {
    if (cands[i].letter !== "A") continue;
    const chain = [cands[i]];
    for (let li = 1; li < order.length; li++) {
      const next = cands.find((c) => c.letter === order[li] && c.idx > chain[chain.length - 1].idx);
      if (!next) break;
      chain.push(next);
    }
    if (chain.length >= 3) {
      if (!best || chain.length > best.length) best = chain;
      if (chain.length >= 4) break;
    }
  }
  return best;
}

const stripBreaks = (h) =>
  h
    .replace(/(?:<br>\s*){2,}/g, "<br>")
    .replace(/^(?:\s|<br>)+/, "")
    .replace(/(?:\s|<br>)+$/, "")
    .replace(/<math>\s*<\/math>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

// ------------------------------------------------------------------ segmentation
const Q_START = /^\s*(\d{1,2})\s*[.)](?!\d)\s*/;

function stripNumberPrefix(html) {
  return html
    .replace(/^(?:\s|<br>)*\d{1,2}\s*<math><mo>[.)]<\/mo>/, "<math>")
    .replace(/^(?:\s|<br>)*\d{1,2}\s*[.)]\s*/, "");
}

function parseKeyBlock(b, st, key) {
  // returns true if the block was consumed as an answer-key entry
  const t = b.plain.trim();
  if (b.row) {
    // answer table: header row names the sections, data rows are "n<TAB>A<TAB>B<TAB>C"
    const cells = b.row;
    if (!/^\d+$/.test(cells[0])) {
      const cols = cells.map((c) => SECTION_BY_FOLD[fold(c)] ?? null);
      if (cols.some(Boolean)) st.tableCols = cols;
      return true;
    }
    const n = Number(cells[0]);
    cells.slice(1).forEach((c, j) => {
      const sec = st.tableCols?.[j + 1];
      if (sec && c) setKey(key, sec, n, c.trim(), st);
    });
    return true;
  }
  const inline = [...t.matchAll(/(\d{1,2})\s*[—–-]\s*([A-E])(?=\d|\s|$)/g)];
  if (inline.length >= 2) {
    inline.forEach((m) => setKey(key, st.keySection, Number(m[1]), m[2], st));
    return true;
  }
  let m = t.match(/^(\d{1,2})\s*[.)]?\s+([A-E])\)?(?:\s*[—–-]?\s*(.*))?$/);
  if (m) {
    setKey(key, st.keySection, Number(m[1]), m[2], st, m[3]);
    return true;
  }
  m = t.match(/^([A-E])\)?(?:\s+(.*))?$/);
  if (m) {
    setKey(key, st.keySection, (st.keyCounter[sectionKey(st.keySection ?? { subject: "?", part: 0 })] ?? 0) + 1, m[1], st, m[2]);
    return true;
  }
  return false;
}

function setKey(key, section, n, letter, st, text) {
  if (!section) return;
  const k = sectionKey(section);
  key[k] ??= {};
  if (key[k][n] && key[k][n].letter !== letter) st.warnings.push(`answer conflict ${k} #${n}: ${key[k][n].letter} vs ${letter}`);
  key[k][n] = { letter, text: (text ?? "").trim() };
  st.keyCounter[k] = n;
}

function segment(blocks) {
  const st = { mode: "q", section: null, keySection: null, keyCounter: {}, tableCols: null, warnings: [] };
  const key = {};
  const questions = [];
  let cur = null;
  const lastN = {};

  const flush = () => {
    if (cur) questions.push(cur);
    cur = null;
  };
  let pending = []; // content after a heading that precedes the first numbered question

  for (let b of blocks) {
    const t = b.plain.trim();
    const empty = !t && !b.images.length;
    if (empty) continue;

    const heading = !b.inTable || !b.row ? SECTION_BY_FOLD[fold(t)] : undefined;
    if (heading && t.length < 20) {
      flush();
      pending = [];
      st.section = heading;
      st.keySection = heading;
      continue;
    }
    if (!b.row && isKeyMarker(t)) {
      flush();
      st.mode = "key";
      st.keySection = st.section;
      continue;
    }

    if (st.mode === "key") {
      if (parseKeyBlock(b, st, key)) continue;
      st.mode = "q"; // a real question: the (mid-document) answer key has ended
    }

    let m = !b.row && Q_START.exec(t);
    // "E) 06. ..." — a typo in the 9-10 file where the next question's number got an option letter
    const typo = !m && !b.row && st.section && /^[A-E]\)\s*0?(\d{1,2})\.\s+\S/.exec(t);
    if (typo && Number(typo[1]) === (lastN[sectionKey(st.section)] ?? 0) + 1 && cur) {
      // the stray "E)" belonged to the previous question's (missing) fifth option: close that question here
      m = typo;
      b = { ...b, html: b.html.replace(/^[A-E]\)\s*0?/, ""), plain: t.replace(/^[A-E]\)\s*0?/, "") };
    }
    if (m && st.section) {
      const n = Number(m[1]);
      const sk = sectionKey(st.section);
      if (lastN[sk] === undefined ? n >= 1 : n > lastN[sk]) {
        if (lastN[sk] === undefined && n === 2 && pending.length) {
          // the first question lost its number (auto-numbered list item in the DOCX)
          cur = { section: st.section, number: 1, blocks: pending };
          lastN[sk] = 1;
        }
        flush();
        pending = [];
        lastN[sk] = n;
        cur = { section: st.section, number: n, blocks: [b] };
        continue;
      }
    }
    if (cur) cur.blocks.push(b);
    else if (st.section) pending.push(b);
    else if (!st.section && m) {
      // 9-10 grade file has no "İNGİLİS DİLİ" heading: questions start straight after the title
      st.section = { subject: "ENGLISH", part: 1 };
      const n = Number(m[1]);
      lastN[sectionKey(st.section)] = n;
      cur = { section: st.section, number: n, blocks: [b] };
    }
  }
  flush();
  return { questions, key, warnings: st.warnings };
}

// ------------------------------------------------------------------ question blocks -> records
function buildQuestion(q, media, mediaIds) {
  const flags = [];
  // Word sometimes starts the equation run with the marker's ")" ("B<math><mo>)</mo>…"): move it out
  const html = q.blocks.map((b) => b.html).join("<br>").replace(/([A-E])<math><mo>\)<\/mo>/g, "$1)<math>");
  const imageFiles = q.blocks.flatMap((b) => b.images);
  const chain = findOptionChain(html);

  let stemHtml;
  let options = [];
  if (chain) {
    stemHtml = html.slice(0, chain[0].idx);
    chain.forEach((c, i) => {
      const end = i + 1 < chain.length ? chain[i + 1].idx : html.length;
      options.push({ label: c.letter, html: stripBreaks(html.slice(c.end, end)) });
    });
  } else {
    stemHtml = html;
    flags.push("no-text-options");
  }
  stemHtml = stripBreaks(stripNumberPrefix(stemHtml.replace(/<!--img:[^>]*-->/g, "")));
  options = options.map((o) => ({ ...o, html: o.html.replace(/<!--img:[^>]*-->/g, "").trim() }));

  const imageIds = [];
  for (const f of imageFiles) {
    const buf = media[f];
    if (!buf) continue;
    const id = createHash("sha1").update(buf).digest("hex").slice(0, 16);
    mediaIds[id] = { buf, ext: "png" };
    if (!imageIds.includes(id)) imageIds.push(id);
  }
  if (imageIds.length) flags.push("has-image");
  if (options.some((o) => !o.html)) flags.push("empty-option");

  return { subject: q.section.subject, part: q.section.part, number: q.number, stem: stemHtml, options, imageIds, flags };
}

// ------------------------------------------------------------------ main
const files = readdirSync(QUESTIONS_DIR).filter((f) => f.toLowerCase().endsWith(".docx") && !f.startsWith("~$"));
const categories = [];
const all = [];
const mediaIds = {};
const report = [];

for (const file of files.sort()) {
  const cat = categoryFromFile(file);
  if (!cat) {
    report.push(`SKIP  ${file}: file name does not look like "<grades> SİNİFLƏR"`);
    continue;
  }
  const { blocks, media } = await readDocx(join(QUESTIONS_DIR, file));
  const { questions, key, warnings } = segment(blocks);
  categories.push({ ...cat, sourceFile: file });

  const built = questions.map((q) => buildQuestion(q, media, mediaIds));
  const ov = OVERRIDES[cat.key] ?? {};
  for (const q of built) {
    const k = sectionKey(q);
    const entry = key[k]?.[q.number];
    q.answer = entry && /^[A-E]$/.test(entry.letter) ? entry.letter : null;
    if (!q.answer) q.flags.push("no-answer");
    if (entry && entry.text && q.options.length) {
      // cross-check: the key often repeats the answer text; it should appear in the chosen option
      const opt = q.options.find((o) => o.label === entry.letter);
      if (!opt) q.flags.push(`answer-letter-not-an-option:${entry.letter}`);
    }
    const o = ov[`${k}#${q.number}`];
    if (o) {
      if (o.drop) q.drop = true;
      if (o.answer) q.answer = o.answer;
      if (o.answerText) q.answerText = o.answerText;
      if (o.stem !== undefined) q.stem = o.stem;
      if (o.options) q.options = o.options;
      if (o.optionCount) q.optionCount = o.optionCount;
      for (const fig of o.figures ?? []) {
        const buf = readFileSync(join(import.meta.dirname, "figures", fig));
        const id = createHash("sha1").update(buf).digest("hex").slice(0, 16);
        mediaIds[id] = { buf, ext: fig.split(".").pop() };
        q.imageIds = [...q.imageIds, id];
      }
      if (o.note) q.note = o.note;
      q.flags.push("overridden");
      if (o.answer || o.answerText) q.flags = q.flags.filter((f) => f !== "no-answer");
    }
    q.categoryKey = cat.key;
  }
  // questions with images and no text options get synthesised A-D buttons (options live in the image)
  for (const q of built) {
    if (q.drop) continue;
    if (!q.options.length && q.imageIds.length && !q.answerText) {
      const n = q.optionCount ?? (q.answer && "ABCDE".indexOf(q.answer) >= 4 ? 5 : 4);
      q.options = [...("ABCDE".slice(0, n))].map((label) => ({ label, html: "" }));
      q.flags.push("options-in-image");
    }
    if (!q.stem && q.imageIds.length) q.stem = "Şəkildəki tapşırığa baxın və düzgün cavabı seçin.";
  }
  const kept = built.filter((q) => !q.drop);

  // Translations (English / Russian) of the Azerbaijani Logic and Math questions. The English
  // subject is already English and is shown unchanged in every language.
  const tr = existsSync(join(import.meta.dirname, "translations", `${cat.key}.mjs`))
    ? (await import(`./translations/${cat.key}.mjs`)).default
    : {};
  const norm = (t) => numbersIn(t).replace(/,/g, ".").split(".").join(".");
  for (const q of kept) {
    if (q.subject === "ENGLISH") continue;
    const entry = tr[`${q.subject[0]}${q.part}#${q.number}`];
    if (!entry) {
      report.push(`    NO TRANSLATION ${cat.key} ${sectionKey(q)} #${q.number}`);
      continue;
    }
    q.translations = {};
    for (const lang of ["en", "ru"]) {
      if (!entry[lang]) {
        report.push(`    NO ${lang.toUpperCase()} ${cat.key} ${sectionKey(q)} #${q.number}`);
        continue;
      }
      const [stemTpl, optTpl = {}] = entry[lang];
      const base = toTemplate(q.stem);
      if (placeholders(stemTpl) !== placeholders(base.text)) report.push(`    PLACEHOLDERS ${lang} ${cat.key} ${sectionKey(q)} #${q.number}: ${placeholders(base.text)} vs ${placeholders(stemTpl)}`);
      if (norm(stemTpl) !== norm(base.text)) report.push(`    NUMBERS ${lang} ${cat.key} ${sectionKey(q)} #${q.number}: [${norm(base.text)}] vs [${norm(stemTpl)}]`);
      q.translations[lang] = {
        stem: fromTemplate(stemTpl, base.blocks),
        options: q.options.map((o) => {
          if (optTpl[o.label] === undefined) return { label: o.label, html: o.html };
          const ob = toTemplate(o.html);
          return { label: o.label, html: fromTemplate(optTpl[o.label], ob.blocks) };
        }),
      };
    }
  }
  kept.forEach((q, i) => (q.order = i + 1));
  all.push(...kept);

  const counts = {};
  kept.forEach((q) => {
    const k = sectionKey(q);
    counts[k] = (counts[k] ?? 0) + 1;
  });
  report.push(`\n=== ${file}  ->  ${cat.key} (${cat.label})  total ${kept.length}`);
  report.push("    " + Object.entries(counts).map(([k, v]) => `${k}=${v}`).join("  "));
  warnings.forEach((w) => report.push(`    WARN ${w}`));
  for (const q of kept) {
    if (q.flags.some((f) => f !== "has-image" && f !== "overridden") || process.env.VERBOSE) {
      report.push(`    ${sectionKey(q)} #${q.number}  [${q.flags.join(",")}]  opts=${q.options.length} ans=${q.answer}  ${q.stem.replace(/<[^>]*>/g, "").slice(0, 70)}`);
    }
  }
}

if (existsSync(join(OUT_DIR, "media"))) rmSync(join(OUT_DIR, "media"), { recursive: true });
mkdirSync(join(OUT_DIR, "media"), { recursive: true });
const usedMedia = new Set(all.flatMap((q) => q.imageIds));
const mediaExt = {};
for (const [id, { buf, ext }] of Object.entries(mediaIds)) {
  if (!usedMedia.has(id)) continue;
  mediaExt[id] = ext;
  writeFileSync(join(OUT_DIR, "media", `${id}.${ext}`), buf);
}

categories.sort((a, b) => a.sortOrder - b.sortOrder);
writeFileSync(
  join(OUT_DIR, "questions.json"),
  JSON.stringify({ categories, media: mediaExt, questions: all.map(({ flags, drop, optionCount, ...q }) => ({ ...q, ...(flags.includes("options-in-image") ? { optionsInImage: true } : {}) })) }, null, 1) + "\n",
);
console.log(report.join("\n"));
console.log(`\nWrote ${all.length} questions, ${usedMedia.size} images, ${categories.length} categories.`);
