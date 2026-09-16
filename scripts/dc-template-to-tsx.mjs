// Compiles the approved parent-dashboard template (parent-dashboard.html's own
// markup, kept verbatim in src/features/parent-dashboard/template.html) into a
// React render function. The markup and inline styles are not touched: only
// the file's template directives are translated —
//   {{ expr }}                      -> {expr}
//   <sc-if value="{{ x }}">…        -> {x ? <>…</> : null}
//   <sc-for list="{{ xs }}" as="x"> -> {xs.map((x, i) => <Fragment key={i}>…</Fragment>)}
//   sc-camel-on-click / -view-box   -> onClick / viewBox (camelCase props)
//   style="a:b;c:d"                 -> style={{ a: "b", c: "d" }}
//   style="{{ x }}"                 -> style={sx(x)}      (runtime string -> object)
//   style-hover / style-active / style-focus -> a generated :hover/:active/:focus class
//
// Usage: node scripts/dc-template-to-tsx.mjs [feature ...]   (default: every feature below)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFragment } from "parse5";

const here = dirname(fileURLToPath(import.meta.url));

// One entry per compiled design: the feature folder under src/features, the
// class the template root gets (scopes the feature's CSS) and the prefix for
// the generated hover/active/focus classes.
const FEATURES = {
  "parent-dashboard": { root: "pp-root", prefix: "pp" },
  "student-dashboard": { root: "sd-root", prefix: "sd" },
};

// ---------- helpers -------------------------------------------------------

const BINDING = /\{\{\s*([^}]*?)\s*\}\}/g;
const BINDING_ONE = /\{\{\s*([^}]*?)\s*\}\}/;

function camel(name) {
  // -webkit-backdrop-filter -> WebkitBackdropFilter, stroke-width -> strokeWidth
  if (name.startsWith("--")) return name;
  const vendor = name.startsWith("-");
  const out = name.replace(/^-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  return vendor ? out[0].toUpperCase() + out.slice(1) : out;
}

/** Split a CSS declaration list on ';' that are outside quotes/parentheses. */
function splitDecls(css) {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = "";
  for (const ch of css) {
    if (quote) {
      if (ch === quote) quote = null;
      cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === ";" && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

function styleObjectLiteral(css) {
  // CSS lets a declaration repeat (the last one wins); an object literal cannot.
  const decls = new Map();
  for (const decl of splitDecls(css)) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const key = camel(decl.slice(0, i).trim());
    decls.delete(key);
    decls.set(key, decl.slice(i + 1).trim());
  }
  const parts = [];
  for (const [key, value] of decls) {
    const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
    parts.push(`${safeKey}: ${JSON.stringify(value)}`);
  }
  return `{ ${parts.join(", ")} }`;
}

const ATTR_RENAME = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  spellcheck: "spellCheck",
  crossorigin: "crossOrigin",
};

function reactAttrName(name) {
  if (name.startsWith("sc-camel-")) return camel(name.slice("sc-camel-".length));
  if (ATTR_RENAME[name]) return ATTR_RENAME[name];
  if (name.startsWith("data-") || name.startsWith("aria-")) return name;
  if (name.includes("-")) return camel(name);
  return name;
}

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const INLINE = new Set(["span", "i", "a", "b", "em", "strong", "small", "button", "input", "img", "svg", "label", "code", "sup", "sub"]);

/** Resolve a template expression to JS, prefixing free identifiers with `v.`. */
function expr(raw, scope) {
  const src = raw.trim();
  const head = src.match(/^[A-Za-z_$][\w$]*/)?.[0];
  if (!head) throw new Error(`Unsupported expression: ${raw}`);
  return scope.has(head) ? src : `v.${src}`;
}

/** Text with {{ }} bindings -> a JSX child list. */
function textToJsx(text, scope) {
  const out = [];
  let last = 0;
  for (const m of text.matchAll(BINDING)) {
    if (m.index > last) out.push(literal(text.slice(last, m.index)));
    out.push(`{${expr(m[1], scope)}}`);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(literal(text.slice(last)));
  return out.join("");
}

function literal(s) {
  // JSX collapses/strips whitespace around newlines and can't hold {,},<,> raw.
  if (/^[^{}<>\r\n]*$/.test(s) && s === s.trim()) return s;
  return `{${JSON.stringify(s)}}`;
}

/** Attribute value with {{ }} bindings -> JSX attribute value. */
function attrValue(value, scope) {
  const matches = [...value.matchAll(BINDING)];
  if (matches.length === 0) return JSON.stringify(value);
  if (matches.length === 1 && matches[0][0] === value.trim()) return `{${expr(matches[0][1], scope)}}`;
  let tpl = "`";
  let last = 0;
  for (const m of matches) {
    tpl += value.slice(last, m.index).replace(/[`\\$]/g, (c) => `\\${c}`);
    tpl += "${" + expr(m[1], scope) + "}";
    last = m.index + m[0].length;
  }
  tpl += value.slice(last).replace(/[`\\$]/g, (c) => `\\${c}`) + "`";
  return `{${tpl}}`;
}

// ---------- state classes (style-hover / style-active / style-focus) --------

let current; // { root, prefix, stateRules, cssLines, loopCounter, rootElement } for the feature being compiled

function stateClass(kind, css) {
  const key = `${kind}|${css}`;
  let cls = current.stateRules.get(key);
  if (!cls) {
    cls = `${current.prefix}-${kind[0]}${current.stateRules.size + 1}`;
    current.stateRules.set(key, cls);
    const decls = splitDecls(css)
      .map((d) => `${d} !important`)
      .join("; ");
    current.cssLines.push(`.${current.root} .${cls}:${kind} { ${decls}; }`);
  }
  return cls;
}

// ---------- emit ------------------------------------------------------------

function isWhitespaceOnly(node) {
  return node.nodeName === "#text" && node.value.trim() === "";
}

function emitChildren(parent, scope, indent) {
  const kids = parent.childNodes ?? [];
  const parentStyle = parent.attrs?.find((a) => a.name === "style")?.value ?? "";
  const parentIsFlexOrGrid = /display\s*:\s*(inline-)?(flex|grid)/.test(parentStyle);
  const out = [];
  for (let i = 0; i < kids.length; i++) {
    const node = kids[i];
    if (node.nodeName === "#comment") continue;
    if (isWhitespaceOnly(node)) {
      // Whitespace matters only between inline boxes in an inline formatting
      // context — the browser renders it as one space; flex/grid ignore it.
      if (!node.value.includes("\n")) {
        const prev = kids[i - 1];
        const next = kids[i + 1];
        if (prev && next && !parentIsFlexOrGrid) out.push(`${indent}{" "}`);
        continue;
      }
      if (parentIsFlexOrGrid) continue;
      const prev = kids.slice(0, i).reverse().find((k) => !isWhitespaceOnly(k) && k.nodeName !== "#comment");
      const next = kids.slice(i + 1).find((k) => !isWhitespaceOnly(k) && k.nodeName !== "#comment");
      const inline = (k) => k && (k.nodeName === "#text" || INLINE.has(k.nodeName));
      if (inline(prev) && inline(next)) out.push(`${indent}{" "}`);
      continue;
    }
    if (node.nodeName === "#text") {
      const jsx = textToJsx(node.value.replace(/\s*\n\s*/g, " "), scope);
      if (jsx.trim()) out.push(`${indent}${jsx.trim()}`);
      continue;
    }
    out.push(emitElement(node, scope, indent));
  }
  return out;
}

function emitElement(node, scope, indent) {
  const attrs = Object.fromEntries(node.attrs.map((a) => [a.name, a.value]));

  if (node.nodeName === "sc-if") {
    const cond = expr(attrs.value.match(BINDING_ONE)?.[1] ?? attrs.value, scope);
    const body = emitChildren(node, scope, indent + "    ");
    return `${indent}{${cond} ? (\n${indent}  <>\n${body.join("\n")}\n${indent}  </>\n${indent}) : null}`;
  }

  if (node.nodeName === "sc-for") {
    const list = expr(attrs.list.match(BINDING_ONE)?.[1] ?? attrs.list, scope);
    const as = attrs.as;
    const idx = `i${current.loopCounter++}`;
    const inner = new Set(scope);
    inner.add(as);
    const body = emitChildren(node, inner, indent + "    ");
    return `${indent}{${list}.map((${as}, ${idx}) => (\n${indent}  <Fragment key={${idx}}>\n${body.join("\n")}\n${indent}  </Fragment>\n${indent}))}`;
  }

  const tag = node.tagName;
  const props = [];
  const classes = [];
  let classExpr = null;

  for (const [name, value] of Object.entries(attrs)) {
    if (name === "style") {
      const m = value.match(BINDING_ONE);
      if (m && m[0] === value.trim()) props.push(`style={sx(${expr(m[1], scope)})}`);
      else if (m) throw new Error(`Mixed static/dynamic style not supported: ${value}`);
      else props.push(`style={${styleObjectLiteral(value)}}`);
      continue;
    }
    if (name === "style-hover" || name === "style-active" || name === "style-focus") {
      classes.push(stateClass(name.slice("style-".length), value));
      continue;
    }
    if (name === "class") {
      const m = value.match(BINDING_ONE);
      if (m) classExpr = attrValue(value, scope);
      else classes.push(...value.split(/\s+/).filter(Boolean));
      continue;
    }
    if (name === "value" && tag === "input") {
      // never emit a bare `value` — React would make the field read-only
      throw new Error("input value= must be sc-camel-default-value");
    }
    props.push(`${reactAttrName(name)}=${attrValue(value, scope)}`);
  }

  if (node === current.rootElement) classes.unshift(current.root);

  if (classExpr && classes.length) {
    props.push(`className={${classExpr.slice(1, -1)} + ${JSON.stringify(" " + classes.join(" "))}}`);
  } else if (classExpr) {
    props.push(`className=${classExpr}`);
  } else if (classes.length) {
    props.push(`className=${JSON.stringify(classes.join(" "))}`);
  }

  const open = `<${tag}${props.length ? " " + props.join(" ") : ""}`;
  if (VOID.has(tag)) return `${indent}${open} />`;

  const kids = emitChildren(node, scope, indent + "  ");
  if (kids.length === 0) return `${indent}${open}></${tag}>`;
  const singleShortText = kids.length === 1 && !kids[0].trim().startsWith("<") && !kids[0].trim().startsWith("{v.") && kids[0].trim().length < 60 && !kids[0].includes("\n");
  if (singleShortText) return `${indent}${open}>${kids[0].trim()}</${tag}>`;
  return `${indent}${open}>\n${kids.join("\n")}\n${indent}</${tag}>`;
}

function compile(feature) {
  const cfg = FEATURES[feature];
  if (!cfg) throw new Error(`unknown feature "${feature}" — known: ${Object.keys(FEATURES).join(", ")}`);
  const featureDir = join(here, "..", "src", "features", feature);
  const templatePath = join(featureDir, "template.html");
  const tsxOut = join(featureDir, "template.generated.tsx");
  const cssOut = join(featureDir, "styles", "template.generated.css");

  const fragment = parseFragment(readFileSync(templatePath, "utf8"));
  const rootElement = fragment.childNodes.find((n) => n.nodeName !== "#text" && n.nodeName !== "#comment");
  const others = fragment.childNodes.filter((n) => n !== rootElement && !(n.nodeName === "#text" && n.value.trim() === ""));
  if (others.length) throw new Error("template must have exactly one root element");

  current = { ...cfg, stateRules: new Map(), cssLines: [], loopCounter: 0, rootElement };
  const body = emitElement(rootElement, new Set(), "    ");

  const tsx = `/* eslint-disable */
// GENERATED FILE — do not edit. Source: src/features/${feature}/template.html
// Regenerate with: node scripts/dc-template-to-tsx.mjs
import { Fragment } from "react";
import { sx } from "./sx";
import type { TemplateVals } from "./vals";

export function renderTemplate(v: TemplateVals) {
  return (
${body}
  );
}
`;

  writeFileSync(tsxOut, tsx);
  writeFileSync(
    cssOut,
    `/* GENERATED FILE — do not edit. Hover/active/focus styles lifted from the template's style-* attributes. */\n${current.cssLines.join("\n")}\n`
  );
  console.log(`wrote ${tsxOut} (${tsx.length} chars), ${cssOut} (${current.cssLines.length} rules)`);
}

const requested = process.argv.slice(2);
for (const feature of requested.length ? requested : Object.keys(FEATURES)) compile(feature);
