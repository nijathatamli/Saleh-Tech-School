// Lists the exact unnamed controls, unlabeled fields and horizontal-overflow culprits on given routes.
//   node qa/ui/diagnose-a11y.mjs <role> <path> [mobile]
import { launch, loginViaUi, routes, VIEWPORTS, BASE } from "./lib.mjs";
const [role, path, vp = "desktop"] = process.argv.slice(2);
const browser = await launch();
const ctx = await browser.newContext({ viewport: VIEWPORTS[vp] });
const page = await ctx.newPage();
if (role !== "public") await loginViaUi(page, role);
await page.goto(BASE + path, { waitUntil: "load" });
await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
const r = await page.evaluate(() => {
  const vis = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const name = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.querySelector("img[alt]")?.getAttribute("alt") || "").trim();
  const short = (el) => el.outerHTML.replace(/\s+/g, " ").slice(0, 170);
  const unnamed = [...document.querySelectorAll("button, a[href], [role=button]")].filter(vis).filter((c) => !name(c)).map(short);
  const labelled = (f) => f.getAttribute("aria-label") || f.getAttribute("aria-labelledby") || (f.id && document.querySelector(`label[for="${f.id}"]`)) || f.closest("label") || f.getAttribute("placeholder") || f.getAttribute("title");
  const unlabeled = [...document.querySelectorAll("input:not([type=hidden]), select, textarea")].filter(vis).filter((f) => !labelled(f)).map(short);
  const wide = [...document.querySelectorAll("body *")].filter(vis).filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).slice(0, 8).map((e) => `${e.tagName.toLowerCase()}.${(e.className || "").toString().slice(0, 60)} right=${Math.round(e.getBoundingClientRect().right)} w=${Math.round(e.getBoundingClientRect().width)}`);
  return { unnamed, unlabeled, wide, innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth };
});
console.log(JSON.stringify(r, null, 1));
await browser.close();
