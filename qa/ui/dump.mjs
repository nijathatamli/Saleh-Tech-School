// Prints the visible interactive elements of a page (helper for writing UI flows).   node qa/ui/dump.mjs <role|public> <path> [mobile]
import { launch, loginViaUi, BASE, VIEWPORTS } from "./lib.mjs";
const [role, path, vp = "desktop"] = process.argv.slice(2);
const b = await launch(); const ctx = await b.newContext({ viewport: VIEWPORTS[vp] }); const page = await ctx.newPage();
if (role !== "public") await loginViaUi(page, role);
await page.goto(BASE + path); await page.waitForLoadState("networkidle").catch(() => {});
const rows = await page.$$eval("a[href], button, input:not([type=hidden]), select, textarea, [role=button]", (els) => els.filter((e) => e.offsetParent !== null).map((e) => `${e.tagName.toLowerCase()}${e.type ? "[" + e.type + "]" : ""}${e.name ? " name=" + e.name : ""}${e.getAttribute("role") ? " role=" + e.getAttribute("role") : ""} :: ${(e.getAttribute("aria-label") || e.innerText || e.placeholder || "").replace(/\s+/g, " ").trim().slice(0, 50)}${e.href ? " -> " + e.getAttribute("href") : ""}`));
console.log(rows.join("\n"));
await b.close();
