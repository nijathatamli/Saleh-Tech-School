// UI smoke audit: every route of the public site and the four panels, signed in through the real form,
// on a desktop and a phone viewport. Records HTTP status, console/page errors, failed requests, broken images,
// horizontal overflow on phones, unlabeled controls and missing page basics. Output: JSON on stdout / --out file.
import fs from "node:fs";
import { launch, loginViaUi, watch, routes, VIEWPORTS, BASE } from "./lib.mjs";

const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
const R = await routes();
const browser = await launch();
const results = [];

async function probe(page, w, role, path, vp) {
  w.reset();
  let status = null, err = null;
  try {
    const res = await page.goto(BASE + path, { waitUntil: "load", timeout: 45_000 });
    status = res?.status() ?? null;
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
  } catch (e) { err = String(e).slice(0, 200); }
  const info = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
    const imgs = [...document.images].filter(vis);
    const name = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.querySelector("img[alt]")?.getAttribute("alt") || "").trim();
    const controls = [...document.querySelectorAll("button, a[href], [role=button]")].filter(vis);
    const fields = [...document.querySelectorAll("input:not([type=hidden]), select, textarea")].filter(vis);
    const labelled = (f) => f.getAttribute("aria-label") || f.getAttribute("aria-labelledby") || (f.id && document.querySelector(`label[for="${f.id}"]`)) || f.closest("label") || f.getAttribute("placeholder") || f.getAttribute("title");
    return {
      title: document.title, lang: document.documentElement.lang, h1: document.querySelectorAll("h1").length,
      brokenImages: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc.replace(location.origin, "").slice(0, 100)),
      imagesWithoutAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      controls: controls.length,
      unnamedControls: controls.filter((c) => !name(c)).length,
      fields: fields.length, unlabeledFields: fields.filter((f) => !labelled(f)).length,
      textLength: document.body.innerText.length,
    };
  }).catch((e) => ({ evalError: String(e).slice(0, 120) }));
  results.push({ role, vp, path, status, err, ...info, console: [...w.log.console], pageerrors: [...w.log.pageerrors], failed: [...w.log.failed], bad: [...w.log.bad] });
}

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  const anonCtx = await browser.newContext({ viewport });
  const anon = await anonCtx.newPage(); const aw = watch(anon);
  for (const p of R.public) await probe(anon, aw, "public", p, vpName);
  await anonCtx.close();
  for (const role of ["admin", "teacher", "student", "parent"]) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage(); const w = watch(page);
    await loginViaUi(page, role);
    for (const p of R[role]) await probe(page, w, role, p, vpName);
    await ctx.close();
  }
}
await browser.close();
const json = JSON.stringify(results, null, 1);
if (out) fs.writeFileSync(out, json); else console.log(json);
const bad = results.filter((r) => r.status >= 400 || r.err || r.pageerrors?.length || r.brokenImages?.length);
console.error(`pages probed: ${results.length}; with hard problems: ${bad.length}`);
for (const r of bad) console.error(`  ${r.vp} ${r.role} ${r.path} status=${r.status} err=${r.err ?? ""} pageerrors=${(r.pageerrors ?? []).length} broken=${(r.brokenImages ?? []).join(",")}`);
