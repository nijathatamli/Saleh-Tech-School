// Blog: the BLOGGER role and its panel API, publish rules (cover + alt + body), scheduling, ownership, safe Markdown, public pages,
// category/search/pagination, view counter, RSS + sitemap, admin moderation and author accounts.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, BASE, Client, loginAs, makeWorld, tag } from "./helpers.mjs";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const BODY = "Bu məqalə uşaqlara kod yazmağı necə öyrətmək haqqındadır. ".repeat(8);
const MD = `## Birinci bölmə\n\n${BODY}\n\n### Alt bölmə\n\n- bir\n- iki\n\n[Kurslar](/kurslar) və [pis link](javascript:alert(1))\n\n<script>window.__pwned=1</script>\n\n<img src=x onerror=alert(1)>\n\n| a | b |\n|---|---|\n| 1 | 2 |\n`;

let admin, w, t, A, B, aUser, bUser, cover;
const mkAuthor = async (n, pw = "Blogger-pw-1") => {
  const email = `qa.blog${n}.${t}@qa.test`;
  const r = await admin.post("/api/admin/blog/authors", { name: `QA Blogger ${n} ${t}`, email, password: pw, position: "QA müəllif", bio: "QA bio" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { email, pw, userId: r.body.id };
};
const upload = async (c) => {
  const fd = new FormData();
  fd.append("file", new Blob([PNG], { type: "image/png" }), "x.png");
  const res = await c.raw("/api/uploads", { method: "POST", body: fd });
  assert.equal(res.status, 200);
  return (await res.json()).url;
};
const input = (o = {}) => ({ title: `QA yazı ${tag()}`, content: MD, category: "Texnologiya", tags: ["qa", "kod"], coverUrl: cover, coverAlt: "QA qapaq şəkli", excerpt: "", status: "PUBLISHED", publishedAt: null, metaTitle: "", metaDescription: "", ...o });
const create = async (c, o) => {
  const r = await c.post("/api/blogger/posts", input(o));
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return r.body;
};
const html = async (path, c = new Client("v")) => c.page(path);

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  t = tag();
  w = await makeWorld(admin, t);
  aUser = await mkAuthor("A");
  bUser = await mkAuthor("B");
  A = await loginAs(aUser.email, aUser.pw, "blogA");
  B = await loginAs(bUser.email, bUser.pw, "blogB");
  cover = await upload(A);
});

test("BLOG-01 only an admin creates author accounts; duplicates and weak passwords are refused", async () => {
  const anon = new Client("anon");
  assert.equal((await anon.post("/api/admin/blog/authors", { name: "Anon Anon", email: `x.${t}@qa.test`, password: "Passw0rd!x" })).status, 401);
  for (const u of [w.teacherA, w.parent1, w.student1]) {
    const c = await loginAs(u.email, w.pw);
    assert.equal((await c.post("/api/admin/blog/authors", { name: "Not Admin", email: `y.${t}@qa.test`, password: "Passw0rd!x" })).status, 403, u.email);
  }
  assert.equal((await A.post("/api/admin/blog/authors", { name: "Self Made", email: `z.${t}@qa.test`, password: "Passw0rd!x" })).status, 403, "a blogger cannot create authors");
  assert.equal((await admin.post("/api/admin/blog/authors", { name: "Dup Author", email: aUser.email, password: "Passw0rd!x" })).status, 409);
  assert.equal((await admin.post("/api/admin/blog/authors", { name: "Weak Pw", email: `w.${t}@qa.test`, password: "123" })).status, 400);
});

test("BLOG-02 role isolation: a blogger reaches only the blog panel, and nobody else reaches it", async () => {
  assert.equal(A.user.role, "BLOGGER");
  for (const p of ["/api/admin/blog", "/api/admin/teachers", "/api/admin/students"]) assert.equal((await A.get(p)).status, 403, p);
  assert.equal((await A.get("/api/teacher/classes")).status >= 400, true);
  const anon = new Client("anon");
  assert.equal((await anon.get("/api/blogger/posts")).status, 401);
  for (const u of [w.teacherA, w.parent1, w.student1]) {
    const c = await loginAs(u.email, w.pw);
    assert.equal((await c.get("/api/blogger/posts")).status, 403, u.email);
    assert.equal((await c.post("/api/blogger/posts", input())).status, 403);
    const pg = await c.page("/blogger");
    assert.ok(pg.status >= 300 && pg.status < 400 && /giris/.test(pg.location ?? ""), `/blogger for ${u.email} → ${pg.status} ${pg.location}`);
  }
  const anonPage = await anon.page("/blogger");
  assert.ok(anonPage.status >= 300 && anonPage.status < 400, "anonymous is redirected away from the panel");
  const adm = await A.page("/admin");
  assert.ok(adm.status >= 300 && adm.status < 400 && /giris/.test(adm.location ?? ""), "blogger is sent away from /admin");
  const ok = await A.page("/blogger");
  assert.equal(ok.status, 200);
  assert.match(ok.html, /Bloq paneli|Yeni yazı/);
});

test("BLOG-03 drafts may be incomplete, are validated, get unique slugs and stay invisible to the public", async () => {
  const d = await create(A, { status: "DRAFT", title: `QA qaralama yazısı ${t}`, content: "qısa", coverUrl: null, coverAlt: "" });
  assert.equal(d.status, "DRAFT");
  assert.equal(d.publishedAt, null);
  const d2 = await create(A, { status: "DRAFT", title: `QA qaralama yazısı ${t}`, content: "qısa", coverUrl: null, coverAlt: "" });
  assert.notEqual(d2.slug, d.slug, "same title → different slug");
  assert.equal(d2.slug, `${d.slug}-2`, "Azerbaijani letters transliterated, suffix added");
  assert.equal((await html(`/bloq/${d.slug}`)).status, 404, "a draft is not public");
  const list = await html("/bloq");
  assert.ok(!list.html.includes(`QA qaralama yazısı ${t}`));
  assert.ok(!(await (await fetch(`${BASE}/sitemap.xml`)).text()).includes(d.slug));
  // validation
  assert.equal((await A.post("/api/blogger/posts", input({ category: "Yoxdur" }))).status, 400);
  assert.equal((await A.post("/api/blogger/posts", input({ title: "abc" }))).status, 400);
  assert.equal((await A.post("/api/blogger/posts", input({ tags: Array.from({ length: 9 }, (_, i) => `etiket${i}`) }))).status, 400);
  assert.equal((await A.post("/api/blogger/posts", input({ slug: "Pis Ünvan!" }))).status, 400);
  assert.equal((await A.post("/api/blogger/posts", input({ coverUrl: "javascript:alert(1)" }))).status, 400, "cover must be an upload or https URL");
  assert.equal((await A.post("/api/blogger/posts", input({ publishedAt: "yesterday" }))).status, 400);
});

test("BLOG-04 going live needs a body, a cover and its alt text; then the public page shows it", async () => {
  const p1 = await A.post("/api/blogger/posts", input({ coverUrl: null }));
  assert.equal(p1.status, 422);
  assert.ok(p1.body.fields.coverUrl);
  const p2 = await A.post("/api/blogger/posts", input({ coverAlt: "" }));
  assert.equal(p2.status, 422);
  assert.ok(p2.body.fields.coverAlt);
  const p3 = await A.post("/api/blogger/posts", input({ content: "çox qısa" }));
  assert.equal(p3.status, 422);
  assert.ok(p3.body.fields.content);
  const post = await create(A, { title: "QA Python ilə ilk addımlar" });
  assert.equal(post.status, "PUBLISHED");
  assert.ok(post.publishedAt);
  assert.ok(post.readingMinutes >= 1);
  assert.ok(post.excerpt.length > 20 && post.excerpt.length <= 160, "excerpt is taken from the body");
  const pg = await html(`/bloq/${post.slug}`);
  assert.equal(pg.status, 200);
  assert.match(pg.html, /QA Python ilə ilk addımlar/);
  assert.equal((pg.html.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.ok(pg.html.includes('"@type":"BlogPosting"'));
  assert.match(pg.html, /property="og:type" content="article"/);
  assert.match(pg.html, /property="article:published_time"/);
  assert.match(pg.html, /<link rel="canonical" href="https?:\/\/[^"]+\/bloq\//);
  assert.match(pg.html, /<img[^>]*alt="QA qapaq şəkli"/, "cover has its alt text");
  const title = pg.html.match(/<title>(.*?)<\/title>/)[1];
  assert.ok(title.length <= 60, `title ${title.length}`);
});

test("BLOG-05 Markdown is rendered safely: headings get ids and a contents box, raw HTML and javascript: links do not survive", async () => {
  const post = await create(A, { title: "QA təhlükəsiz markdown" });
  const { html: h } = await html(`/bloq/${post.slug}`);
  assert.match(h, /<h2 id="birinci-bolme">Birinci bölmə<\/h2>/);
  assert.match(h, /<h3 id="alt-bolme">Alt bölmə<\/h3>/);
  assert.match(h, /href="#birinci-bolme"/, "contents box links to the heading");
  assert.match(h, /<table>/, "GFM tables");
  assert.match(h, /<a href="\/kurslar">Kurslar<\/a>/);
  assert.ok(!/<script>window\.__pwned/.test(h), "raw <script> in the body is not rendered");
  assert.ok(!/<img[^>]*onerror/i.test(h), "raw <img onerror> is not an element (it is shown as escaped text at most)");
  assert.ok(!/href="javascript:/i.test(h), "javascript: links are stripped");
  // a title with markup is escaped
  const xss = await create(A, { title: "QA <img src=x onerror=alert(2)> başlıq" });
  const x = (await html(`/bloq/${xss.slug}`)).html;
  assert.ok(!x.includes("<img src=x onerror"), "title is escaped");
});

test("BLOG-06 scheduling: a future date keeps a post off the site until it is due", async () => {
  const future = new Date(Date.now() + 3 * 86400_000).toISOString();
  const post = await create(A, { title: "QA planlanmış yazı", publishedAt: future });
  assert.equal(new Date(post.publishedAt).toISOString(), future);
  assert.equal((await html(`/bloq/${post.slug}`)).status, 404, "scheduled posts are not public");
  assert.ok(!(await html("/bloq")).html.includes("QA planlanmış yazı"));
  assert.ok(!(await (await fetch(`${BASE}/bloq/rss.xml`)).text()).includes(post.slug));
  assert.ok(!(await (await fetch(`${BASE}/sitemap.xml`)).text()).includes(post.slug));
  const own = await A.page("/blogger/yazilar");
  assert.match(own.html, /Planlanıb/);
  const now = await A.patch(`/api/blogger/posts/${post.id}`, input({ title: "QA planlanmış yazı", publishedAt: new Date(Date.now() - 60_000).toISOString() }));
  assert.equal(now.status, 200);
  assert.equal((await html(`/bloq/${post.slug}`)).status, 200, "live once the date has passed");
});

test("BLOG-07 ownership: another author cannot read, change or delete a post; each sees only their own list", async () => {
  const post = await create(A, { title: "QA yalnız A-nındır" });
  assert.equal((await B.get(`/api/blogger/posts/${post.id}`)).status, 404);
  assert.equal((await B.patch(`/api/blogger/posts/${post.id}`, input())).status, 404);
  assert.equal((await B.del(`/api/blogger/posts/${post.id}`)).status, 404);
  const bList = (await B.get("/api/blogger/posts")).body;
  assert.ok(!bList.items.some((p) => p.id === post.id));
  const aList = (await A.get("/api/blogger/posts?size=100")).body;
  assert.ok(aList.items.some((p) => p.id === post.id));
  assert.equal((await B.page(`/blogger/yazilar/${post.id}`)).status, 404, "editor page of someone else's post");
  assert.equal((await A.get(`/api/blogger/posts/${post.id}`)).status, 200);
});

test("BLOG-08 editing: slug can change (not onto another post's), republishing keeps the date, back to draft hides it", async () => {
  const p = await create(A, { title: "QA redaktə yazısı" });
  const other = await create(A, { title: "QA başqa yazı" });
  const taken = await A.patch(`/api/blogger/posts/${p.id}`, input({ title: p.title, slug: other.slug }));
  assert.equal(taken.status, 409);
  const ren = await A.patch(`/api/blogger/posts/${p.id}`, input({ title: "QA redaktə yazısı yeni", slug: `qa-yeni-${t}` }));
  assert.equal(ren.status, 200);
  assert.equal(ren.body.slug, `qa-yeni-${t}`);
  assert.equal(new Date(ren.body.publishedAt).getTime(), new Date(p.publishedAt).getTime(), "an edit keeps the publish date");
  assert.equal((await html(`/bloq/${p.slug}`)).status, 404, "the old address is gone");
  assert.equal((await html(`/bloq/qa-yeni-${t}`)).status, 200);
  const back = await A.patch(`/api/blogger/posts/${p.id}`, input({ title: "QA redaktə yazısı yeni", slug: `qa-yeni-${t}`, status: "DRAFT" }));
  assert.equal(back.body.status, "DRAFT");
  assert.equal((await html(`/bloq/qa-yeni-${t}`)).status, 404);
});

test("BLOG-09 public list: category page, search, pagination, featured post and the empty states", async () => {
  const mark = tag();
  for (let i = 0; i < 10; i++) await create(A, { title: `QA ${mark} sıra ${i}`, category: "Robototexnika", tags: [mark] });
  const p1 = (await html("/bloq")).html;
  assert.match(p1, /href="\/bloq\?page=2"/, "second page exists with more than 9 posts");
  assert.match((await html("/bloq?page=2")).html, /QA/, "page 2 renders");
  const cat = await html("/bloq/kateqoriya/robototexnika");
  assert.equal(cat.status, 200);
  assert.match(cat.html, new RegExp(`QA ${mark} sıra`));
  assert.match(cat.html, /<title>Robototexnika/);
  assert.equal((await html("/bloq/kateqoriya/yoxdur")).status, 404);
  const s = await html(`/bloq?q=${mark}`);
  assert.match(s.html, new RegExp(`QA ${mark} sıra`));
  assert.match(s.html, /<meta name="robots" content="noindex/, "search results are noindex");
  const none = await html(`/bloq?q=${tag()}${tag()}nothing`);
  assert.match(none.html, /Axtarışa uyğun məqalə tapılmadı/);
  const lt = await html("/bloq?q=%3Cscript%3Ealert(1)%3C/script%3E");
  assert.equal(lt.status, 200);
  assert.ok(!lt.html.includes("<script>alert(1)"), "the query is escaped");
});

test("BLOG-10 view counter counts a published post, ignores unknown slugs and is capped per address", async () => {
  const post = await create(A, { title: "QA oxunma sayğacı" });
  const v = new Client("viewer");
  const views = async () => (await A.get(`/api/blogger/posts/${post.id}`)).body.views;
  assert.equal(await views(), 0);
  assert.deepEqual((await v.post("/api/blog/view", { slug: post.slug })).body, { counted: true });
  assert.equal(await views(), 1);
  for (let i = 0; i < 4; i++) await v.post("/api/blog/view", { slug: post.slug });
  assert.equal(await views(), 3, "at most 3 per address and hour");
  assert.equal((await v.post("/api/blog/view", { slug: "yoxdur-bele-yazi" })).status, 200);
  assert.equal((await v.post("/api/blog/view", { slug: "BAD SLUG" })).status, 400);
  const draft = await create(A, { title: "QA qaralama sayğac", status: "DRAFT", coverUrl: null, content: "x" });
  await new Client("v2").post("/api/blog/view", { slug: draft.slug });
  assert.equal((await A.get(`/api/blogger/posts/${draft.id}`)).body.views, 0, "drafts are not counted");
});

test("BLOG-11 RSS and sitemap list live posts and categories", async () => {
  const post = await create(A, { title: "QA rss yazısı", category: "Valideynlər üçün" });
  const rss = await fetch(`${BASE}/bloq/rss.xml`);
  assert.equal(rss.status, 200);
  assert.match(rss.headers.get("content-type"), /rss\+xml/);
  const x = await rss.text();
  assert.ok(x.includes(`/bloq/${post.slug}`) && x.includes("<rss"));
  const site = await (await fetch(`${BASE}/sitemap.xml`)).text();
  assert.ok(site.includes(`/bloq/${post.slug}`));
  assert.ok(site.includes("/bloq/kateqoriya/valideynler-ucun"));
  assert.ok(site.includes("/bloq</loc>"));
});

test("BLOG-12 author profile: validated, shown on the post, avatar must be an upload", async () => {
  assert.equal((await A.patch("/api/blogger/profile", { name: "ab" })).status, 400);
  assert.equal((await A.patch("/api/blogger/profile", { avatarUrl: "https://evil.example/x.png" })).status, 400);
  const avatar = await upload(A);
  const r = await A.patch("/api/blogger/profile", { position: "QA baş redaktor", bio: "Mən QA müəllifiyəm.", avatarUrl: avatar });
  assert.equal(r.status, 200);
  const post = await create(A, { title: "QA müəllif qutusu" });
  const h = (await html(`/bloq/${post.slug}`)).html;
  assert.match(h, /QA baş redaktor/);
  assert.match(h, /Mən QA müəllifiyəm\./);
  assert.match(h, new RegExp(`QA Blogger A ${t}`));
});

test("BLOG-13 admin moderation: take down, put back, feature, delete; all audited; non-admins cannot", async () => {
  const post = await create(A, { title: "QA moderasiya yazısı" });
  assert.equal((await A.patch(`/api/admin/blog/${post.id}`, { featured: true })).status, 403);
  const down = await admin.patch(`/api/admin/blog/${post.id}`, { status: "DRAFT" });
  assert.equal(down.body.status, "DRAFT");
  assert.equal((await html(`/bloq/${post.slug}`)).status, 404);
  const up = await admin.patch(`/api/admin/blog/${post.id}`, { status: "PUBLISHED" });
  assert.equal(up.body.status, "PUBLISHED");
  assert.equal((await html(`/bloq/${post.slug}`)).status, 200);
  const feat = await admin.patch(`/api/admin/blog/${post.id}`, { featured: true });
  assert.equal(feat.body.featured, true);
  assert.match((await html("/bloq")).html, /Seçilmiş yazı/);
  assert.match((await html("/bloq")).html, /QA moderasiya yazısı/);
  const list = (await admin.get(`/api/admin/blog?q=moderasiya`)).body;
  assert.ok(list.items.some((p) => p.id === post.id) && Array.isArray(list.authors));
  assert.equal((await admin.patch(`/api/admin/blog/${post.id}`, { status: "NOPE" })).status, 400);
  assert.equal((await admin.del(`/api/admin/blog/${post.id}`)).status, 200);
  assert.equal((await html(`/bloq/${post.slug}`)).status, 404);
  assert.equal((await admin.del(`/api/admin/blog/${post.id}`)).status, 404);
  const page = await admin.page("/admin/blog");
  assert.equal(page.status, 200);
  assert.match(page.html, /Bloq müəllifləri/);
});

test("BLOG-14 deactivating an author ends their access at once; their posts stay; reactivation and password reset work", async () => {
  const u = await mkAuthor("C");
  const C = await loginAs(u.email, u.pw, "blogC");
  const post = await create(C, { title: "QA deaktiv müəllif yazısı" });
  assert.equal((await admin.patch(`/api/admin/blog/authors/${u.userId}`, { active: false })).status, 200);
  assert.equal((await C.get("/api/blogger/posts")).status >= 400, true, "old cookie stops working");
  assert.equal(await new Client("c2").login(u.email, u.pw), false, "cannot sign in");
  assert.equal((await html(`/bloq/${post.slug}`)).status, 200, "the post stays on the site");
  assert.equal((await admin.patch(`/api/admin/blog/authors/${u.userId}`, { active: true, password: "Brand-new-pw-9" })).status, 200);
  assert.equal(await new Client("c3").login(u.email, u.pw), false, "old password no longer works");
  assert.equal(await new Client("c4").login(u.email, "Brand-new-pw-9"), true);
  assert.equal((await admin.patch(`/api/admin/blog/authors/${w.teacherA.id}`, { active: false })).status, 404, "only blog authors can be changed here");
  const audit = (await admin.get("/api/admin/audit?action=blog.author&size=100")).body;
  const actions = JSON.stringify(audit);
  assert.ok(/blog\.author\.deactivate/.test(actions) && /blog\.author\.create/.test(actions));
});

test("BLOG-15 the blog pages carry their SEO: list title/description/RSS link, breadcrumb data, navbar link", async () => {
  const l = (await html("/bloq")).html;
  const title = l.match(/<title>(.*?)<\/title>/)[1];
  assert.ok(title.length <= 60, `title ${title.length}`);
  assert.match(l, /<link rel="canonical" href="https?:\/\/[^"]+\/bloq"/);
  assert.match(l, /rel="alternate" type="application\/rss\+xml"/);
  assert.ok(l.includes('"@type":"Blog"') && l.includes('"@type":"BreadcrumbList"'));
  assert.match(l, /href="\/bloq"[^>]*>Bloq</, "navbar link");
  assert.equal((l.match(/<h1[\s>]/g) ?? []).length, 1);
  const home = (await html("/")).html;
  assert.match(home, /href="\/bloq"[^>]*>Bloq</, "landing navbar has Bloq");
});
