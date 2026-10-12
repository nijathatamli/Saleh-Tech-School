// Lab measurement of TTFB / LCP / CLS / load and transferred bytes with a real browser (Chromium, production build).
// LAB data on one machine, no network throttling: it shows regressions and layout shifts, it is NOT field data at the 75th percentile
// and it does not measure INP (needs real interactions from real users).
import { launch, loginViaUi, BASE, VIEWPORTS } from "./../ui/lib.mjs";
const pages = [["public", "/"], ["public", "/kurslar"], ["public", "/sinaq-dersi"], ["public", "/giris"], ["admin", "/admin"], ["admin", "/admin/students"], ["teacher", "/teacher"], ["student", "/student"], ["parent", "/parent"]];
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const browser = await launch();
const out = [];
for (const vpName of ["desktop", "mobile"]) {
  for (const [role, path] of pages) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext({ viewport: VIEWPORTS[vpName], ...(vpName === "mobile" ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}) });
      const page = await ctx.newPage();
      if (role !== "public") await loginViaUi(page, role);
      let bytes = 0; page.on("response", async (r) => { const l = Number(r.headers()["content-length"] ?? 0); bytes += l; });
      await page.addInitScript(() => {
        window.__vitals = { lcp: 0, cls: 0 };
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto(BASE + path, { waitUntil: "load" });
      await page.waitForTimeout(2500);
      const m = await page.evaluate(() => { const n = performance.getEntriesByType("navigation")[0]; return { ttfb: n.responseStart, load: n.loadEventEnd, ...window.__vitals }; });
      runs.push({ ...m, bytes });
      await ctx.close();
    }
    out.push({ vp: vpName, role, path, ttfb: median(runs.map((r) => r.ttfb)), lcp: median(runs.map((r) => r.lcp)), cls: median(runs.map((r) => r.cls)), load: median(runs.map((r) => r.load)), kb: Math.round(median(runs.map((r) => r.bytes)) / 1024) });
  }
}
await browser.close();
console.log("vp       page".padEnd(34), "TTFB ms".padStart(8), "LCP ms".padStart(8), "CLS".padStart(7), "load ms".padStart(8), "KB".padStart(7), " verdict(LCP<=2500, CLS<=0.1)");
for (const r of out) console.log(`${r.vp.padEnd(8)} ${(r.role + " " + r.path).padEnd(24)}`, r.ttfb.toFixed(0).padStart(8), r.lcp.toFixed(0).padStart(8), r.cls.toFixed(3).padStart(7), r.load.toFixed(0).padStart(8), String(r.kb).padStart(7), r.lcp <= 2500 && r.cls <= 0.1 ? "  good" : "  NEEDS WORK");
