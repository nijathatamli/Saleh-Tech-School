// Interactive-element audit. For every route of the public site and the four panels, on desktop and phone:
//   * every visible clickable (links, buttons, role=button/tab/switch, cursor:pointer elements) is listed;
//   * links are resolved: placeholder (#, javascript:), external, mail/tel, or internal → HTTP status of the target;
//   * every button-like element is clicked on a FRESH page load and its effect is measured
//     (navigation, network request, DOM change, dialog) together with console/page errors and 4xx/5xx responses;
//   * form fields are listed with their accessible label.
// Result classes: PASS (observable effect, no error), NO-EFFECT (click did nothing — review), FAIL (error / failed request),
// SKIPPED (logout — verified separately), BLOCKED (not clickable: covered/disabled/off-screen).
//   node qa/ui/clicks.mjs --out file.json [--roles admin,teacher] [--vp desktop] [--enumerate-only]
import fs from "node:fs";
import { launch, loginViaUi, watch, routes, VIEWPORTS, BASE } from "./lib.mjs";

const arg = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const OUT = arg("--out", null);
const ROLES = arg("--roles", "public,admin,teacher,student,parent").split(",");
const VPS = arg("--vp", "desktop,mobile").split(",");
const ENUM_ONLY = process.argv.includes("--enumerate-only");
const POOL = Number(arg("--pool", 4));

const MARK = () => {
  document.querySelectorAll("[data-qa-i]").forEach((e) => e.removeAttribute("data-qa-i"));
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 1 && r.height > 1 && s.visibility !== "hidden" && s.display !== "none" && s.opacity !== "0"; };
  const SEL = "a[href], button, [role=button], [role=tab], [role=switch], [role=menuitem], [role=link], summary, select, input:not([type=hidden]), textarea, label[for]";
  const base = [...document.querySelectorAll(SEL)];
  const pointer = [...document.querySelectorAll("body *")].filter((e) => !e.matches(SEL) && getComputedStyle(e).cursor === "pointer" && !e.closest(SEL) && !e.querySelector(SEL));
  const els = [...new Set([...base, ...pointer])].filter(vis);
  const name = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.innerText || el.textContent || el.getAttribute("placeholder") || el.getAttribute("name") || el.querySelector("img[alt]")?.getAttribute("alt") || "").replace(/\s+/g, " ").trim().slice(0, 60);
  return els.map((el, i) => {
    el.setAttribute("data-qa-i", String(i));
    const tag = el.tagName.toLowerCase();
    const field = ["input", "select", "textarea"].includes(tag);
    return { i, tag, role: el.getAttribute("role"), type: el.getAttribute("type"), text: name(el), href: tag === "a" ? el.getAttribute("href") : null, target: el.getAttribute("target"), rel: el.getAttribute("rel"), disabled: el.disabled === true || el.getAttribute("aria-disabled") === "true", field, hasLabel: field ? !!(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || (el.id && document.querySelector(`label[for="${el.id}"]`)) || el.closest("label") || el.getAttribute("placeholder") || el.getAttribute("title")) : null, pointer: !el.matches(SEL) };
  });
};
const SNAP = () => {
  let h = 5381; const s = document.body.innerHTML; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return { url: location.pathname + location.search, hash: h, dialogs: document.querySelectorAll("[role=dialog], dialog[open]").length, expanded: document.querySelectorAll("[aria-expanded=true]").length, y: Math.round(scrollY) };
};

const LOGOUT = /çıxış|logout|sign out/i;
const DIALOGS = [];

async function load(page, path) {
  await page.goto(BASE + path, { waitUntil: "load", timeout: 45_000 });
  await page.waitForLoadState("networkidle", { timeout: 6_000 }).catch(() => {});
}

async function auditRoute(browser, ctxState, role, vp, path, results) {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vp], storageState: ctxState });
  const first = await ctx.newPage();
  await load(first, path);
  const items = await first.evaluate(MARK);
  const origin = new URL(BASE).origin;
  const linkStatus = new Map();
  const todo = [];
  for (const it of items) {
    const rec = { role, vp, route: path, i: it.i, kind: null, tag: it.tag, text: it.text, href: it.href, status: null, evidence: "" };
    if (it.field) { rec.kind = "field"; rec.status = it.hasLabel ? "PASS" : "FAIL"; rec.evidence = it.hasLabel ? "labelled form field" : "form field without accessible label"; results.push(rec); continue; }
    if (it.tag === "a" && it.href !== null) {
      rec.kind = "link";
      const h = it.href.trim();
      if (h === "" || h === "#" || /^javascript:/i.test(h)) { rec.status = "FAIL"; rec.evidence = "placeholder link (goes nowhere)"; }
      else if (/^(mailto|tel):/i.test(h)) { rec.status = "PASS"; rec.evidence = "mail/tel link"; }
      else if (/^https?:\/\//i.test(h) && !h.startsWith(origin)) { const ok = /noopener/.test(it.rel ?? "") || it.target !== "_blank"; rec.status = ok ? "PASS" : "FAIL"; rec.evidence = ok ? "external link (not followed)" : "external link opens a new tab without rel=noopener"; }
      else {
        const abs = new URL(h, BASE + path).toString().split("#")[0];
        if (!linkStatus.has(abs)) { const r = await ctx.request.get(abs, { maxRedirects: 5, failOnStatusCode: false, timeout: 30_000 }).catch((e) => ({ status: () => -1, e })); linkStatus.set(abs, r.status()); }
        const st = linkStatus.get(abs);
        rec.status = st > 0 && st < 400 ? "PASS" : "FAIL"; rec.evidence = `target ${abs.replace(BASE, "")} -> HTTP ${st}`;
      }
      results.push(rec); continue;
    }
    rec.kind = "button";
    if (LOGOUT.test(it.text)) { rec.status = "SKIPPED"; rec.evidence = "logout: verified by the dedicated sign-out check"; results.push(rec); continue; }
    if (it.disabled) { rec.status = "BLOCKED"; rec.evidence = "disabled in this state"; results.push(rec); continue; }
    todo.push({ it, rec });
  }
  await first.close();
  if (ENUM_ONLY) { for (const t of todo) { t.rec.status = "NOT-RUN"; results.push(t.rec); } await ctx.close(); return; }

  // click every button-like element on a fresh load, POOL pages at a time
  let next = 0;
  const worker = async () => {
    const page = await ctx.newPage();
    const w = watch(page);
    let dialogShown = false;
    page.on("dialog", async (d) => { DIALOGS.push(`${role}${path}: ${d.type()} "${d.message().slice(0, 80)}"`); dialogShown = true; await d.dismiss().catch(() => {}); });
    while (next < todo.length) {
      const { it, rec } = todo[next++];
      try {
        await load(page, path);
        const marked = await page.evaluate(MARK);
        const same = marked[it.i] && marked[it.i].text === it.text && marked[it.i].tag === it.tag;
        if (!same) { rec.status = "BLOCKED"; rec.evidence = "element order changed between loads"; results.push(rec); continue; }
        const loc = page.locator(`[data-qa-i="${it.i}"]`);
        w.reset(); dialogShown = false;
        const before = await page.evaluate(SNAP);
        let clickErr = null;
        await loc.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await loc.click({ timeout: 3000 }).catch((e) => { clickErr = String(e.message).split("\n")[0].slice(0, 100); });
        if (clickErr) { rec.status = "BLOCKED"; rec.evidence = `not clickable: ${clickErr}`; results.push(rec); continue; }
        await page.waitForTimeout(700);
        await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {});
        const after = await page.evaluate(SNAP).catch(() => ({ url: "(navigated)", hash: 0, dialogs: 0, expanded: 0, y: 0 }));
        const net = w.log.requests.filter((r) => !/^GET .*\.(png|jpe?g|svg|webp|woff2?|css|js)/.test(r));
        const mutating = net.filter((r) => /^(POST|PUT|PATCH|DELETE)/.test(r));
        const effects = [];
        if (after.url !== before.url) effects.push(`navigate ${before.url} → ${after.url}`);
        if (mutating.length) effects.push(`request ${mutating[0].slice(0, 60)}`);
        else if (net.length) effects.push(`fetch ${net[0].slice(0, 60)}`);
        if (after.hash !== before.hash) effects.push("DOM changed");
        if (after.dialogs !== before.dialogs) effects.push("dialog toggled");
        if (after.expanded !== before.expanded) effects.push("expanded toggled");
        if (dialogShown) effects.push("native confirm shown");
        if (after.y !== before.y) effects.push("scrolled");
        const errors = [...w.log.pageerrors, ...w.log.console.filter((c) => !/Failed to load resource/.test(c)), ...w.log.failed, ...w.log.bad.filter((b) => !/^404 GET .*_rsc/.test(b))];
        if (errors.length) { rec.status = "FAIL"; rec.evidence = `errors after click: ${errors.slice(0, 2).join(" | ").slice(0, 200)}`; }
        else if (effects.length) { rec.status = "PASS"; rec.evidence = effects.join("; "); }
        else { rec.status = "NO-EFFECT"; rec.evidence = "click produced no navigation, request, DOM or dialog change"; }
        if (mutating.length && !dialogShown && after.dialogs === before.dialogs && /sil|trash|delete|ləğv|arxiv/i.test(it.text)) rec.evidence += " [destructive action ran without confirmation]";
      } catch (e) {
        rec.status = "FAIL"; rec.evidence = `script error: ${String(e.message).split("\n")[0].slice(0, 120)}`;
      }
      results.push(rec);
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: Math.min(POOL, todo.length) }, worker));
  await ctx.close();
}

const R = await routes();
const browser = await launch();
const results = [];
for (const role of ROLES) {
  for (const vp of VPS) {
    let state;
    if (role !== "public") {
      const c = await browser.newContext({ viewport: VIEWPORTS[vp] });
      const p = await c.newPage();
      await loginViaUi(p, role);
      state = await c.storageState();
      await c.close();
    }
    for (const path of R[role]) {
      const t0 = Date.now();
      const before = results.length;
      await auditRoute(browser, state, role, vp, path, results);
      const slice = results.slice(before);
      const c = (s) => slice.filter((r) => r.status === s).length;
      console.error(`${role.padEnd(8)} ${vp.padEnd(7)} ${path.slice(0, 54).padEnd(54)} ${String(slice.length).padStart(3)} el  pass ${c("PASS")} no-effect ${c("NO-EFFECT")} fail ${c("FAIL")} blocked ${c("BLOCKED")} skipped ${c("SKIPPED")}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }
}
await browser.close();
const summary = {};
for (const r of results) summary[r.status] = (summary[r.status] ?? 0) + 1;
console.error("TOTAL", results.length, JSON.stringify(summary));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ results, dialogs: DIALOGS }, null, 1));
