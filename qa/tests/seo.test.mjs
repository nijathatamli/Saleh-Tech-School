// On-page SEO of the public site: title ≤ 60, description ≤ 160, one <h1>, canonical, Open Graph, JSON-LD, alt text on every
// image, sitemap/robots, noindex on the portals and the sign-in flow, and landing page text untouched.
import test from "node:test";
import assert from "node:assert/strict";
import { BASE } from "./helpers.mjs";

const PUBLIC = ["/", "/kurslar", "/kurslar/robotexnika", "/valideyn-paneli", "/reyler", "/teqaud", "/elaqe", "/haqqimizda", "/vakansiyalar", "/sinaq-dersi", "/muellimler"];
const html = async (p) => {
  const r = await fetch(BASE + p);
  assert.equal(r.status, 200, `${p} → ${r.status}`);
  return r.text();
};
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const meta = (h, re) => decode(h.match(re)?.[1] ?? "");

for (const p of PUBLIC) {
  test(`SEO-01 ${p}: title ≤ 60, description 80–160, one h1, canonical, Open Graph, JSON-LD, alt on every image`, async () => {
    const h = await html(p);
    const title = decode(h.match(/<title>(.*?)<\/title>/)?.[1] ?? "");
    assert.ok(title.length >= 20 && title.length <= 60, `title ${title.length}: ${title}`);
    assert.equal((title.match(/Saleh Tech School/g) ?? []).length <= 1, true, "brand not doubled");
    const desc = meta(h, /<meta name="description" content="(.*?)"/);
    assert.ok(desc.length >= 80 && desc.length <= 160, `description ${desc.length}`);
    assert.equal((h.match(/<h1[\s>]/g) ?? []).length, 1, "exactly one <h1>");
    assert.match(h, /<link rel="canonical" href="https?:\/\/[^"]+"/);
    assert.match(h, /<meta property="og:title"/);
    assert.match(h, /<meta property="og:image" content="[^"]*og-image\.png"/);
    assert.match(h, /<meta name="twitter:card" content="summary_large_image"/);
    assert.ok(h.includes("application/ld+json"), "JSON-LD present");
    assert.equal((h.match(/<img(?![^>]*\balt=)[^>]*>/g) ?? []).length, 0, "every <img> has an alt attribute");
    for (const block of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(block[1].replace(/\\u003c/g, "<"));
  });
}

test("SEO-02 each page has its own canonical path", async () => {
  for (const p of PUBLIC.filter((x) => x !== "/")) {
    const c = (await html(p)).match(/<link rel="canonical" href="https?:\/\/[^/"]+([^"]*)"/)?.[1];
    assert.equal(c, p, `canonical of ${p}`);
  }
});

test("SEO-03 course pages carry Course + FAQPage + BreadcrumbList structured data", async () => {
  const h = await html("/kurslar/robotexnika");
  for (const t of ['"@type":"Course"', '"@type":"FAQPage"', '"@type":"BreadcrumbList"']) assert.ok(h.includes(t), t);
});

test("SEO-04 robots.txt allows the site, hides the portals, and points at the sitemap; sitemap lists every public page and course", async () => {
  const robots = await (await fetch(`${BASE}/robots.txt`)).text();
  for (const d of ["/admin", "/parent", "/student", "/teacher", "/api/", "/giris", "/teqaud/imtahan"]) assert.ok(robots.includes(`Disallow: ${d}`), d);
  assert.match(robots, /Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
  const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
  for (const p of PUBLIC.filter((x) => x !== "/")) assert.ok(xml.includes(`${p}</loc>`), `${p} in sitemap`);
  assert.ok(!/\/(admin|parent|student|teacher|giris)</.test(xml), "no private URL in the sitemap");
  assert.ok((xml.match(/\/kurslar\/[a-z-]+<\/loc>/g) ?? []).length >= 10, "every course");
});

test("SEO-05 sign-in and password pages are noindex; the public pages are not", async () => {
  for (const p of ["/giris", "/sifre-unutdum"]) assert.match(await html(p), /<meta name="robots" content="noindex, nofollow"/, p);
  for (const p of PUBLIC) assert.doesNotMatch(await html(p), /<meta name="robots" content="noindex/, p);
});

test("SEO-06 the landing page keeps its original visible text (SEO there is head-only: title, description, alt texts)", async () => {
  const h = await html("/");
  assert.match(h, /<h1[^>]*>Uşağınız gələcəyin <span[^>]*>texnologiyalarını<\/span> bu gündən öyrənsin\./);
  assert.match(h, /Uşaqlar üçün IT və Proqramlaşdırma kursları!/);
  assert.match(h, /href="\/#courses"/, "navbar anchors unchanged");
});

test("SEO-07 home page headings are in order (h1 first, an h2 before the first h3)", async () => {
  const h = await html("/");
  const order = [...h.matchAll(/<h([1-3])[\s>]/g)].map((m) => +m[1]);
  assert.equal(order[0], 1);
  assert.ok(order.indexOf(2) < order.indexOf(3), "an h2 comes before the first h3");
});

test("SEO-08 the landing page announces its courses and main sections in JSON-LD (invisible) and sets hreflang / geo in the head", async () => {
  const h = await html("/");
  for (const t of ['"@type":"WebPage"', '"@type":"ItemList"', '"@type":"SiteNavigationElement"', '"@type":"Course"']) assert.ok(h.includes(t), t);
  for (const p of ["/haqqimizda", "/elaqe", "/vakansiyalar", "/reyler", "/valideyn-paneli"]) assert.ok(h.includes(`${p}"`), `${p} announced to crawlers`);
  assert.match(h, /<link rel="alternate" hreflang="az-AZ"/i);
  assert.match(h, /<meta name="geo\.region" content="AZ"/);
});
