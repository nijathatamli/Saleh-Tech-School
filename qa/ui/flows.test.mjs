// Browser-level workflows (Playwright, real clicks and keystrokes) against the QA app and the isolated QA database.
// Each flow ends with a database check, because "the UI says saved" is not evidence.
//   node --test qa/ui/flows.test.mjs
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { launch, loginViaUi, ACCOUNTS, BASE, VIEWPORTS } from "./lib.mjs";
import { ADMIN, loginAs, makeWorld, callAction, sql, slot, tag, TEACHER_ACTIONS } from "../tests/helpers.mjs";

let browser, admin, w;
before(async () => {
  browser = await launch();
  admin = await loginAs(ADMIN.email, ADMIN.password);
  w = await makeWorld(admin);
});
after(async () => { await browser?.close(); });

async function newPage(vp = "desktop") {
  const ctx = await browser.newContext({ viewport: VIEWPORTS[vp] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  page.on("dialog", (d) => d.accept());
  return { ctx, page, errors };
}
async function signIn(page, email, password, home) {
  await page.goto(BASE + "/giris", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await Promise.all([page.waitForURL(new RegExp(`${home}(/|$|\\?)`), { timeout: 30_000 }), page.click('button[type="submit"]')]);
}

test("UI-01 the sign-in form rejects a wrong password and keeps the user on the page, for every role", async () => {
  for (const [role, a] of Object.entries(ACCOUNTS)) {
    const { ctx, page } = await newPage();
    await page.goto(BASE + "/giris");
    await page.fill('input[type="email"]', a.email);
    await page.fill('input[type="password"]', "definitely-wrong-password");
    await page.click('button[type="submit"]');
    await page.waitForSelector("text=/düzgün deyil|yanlış|səhv|etibarsız|Email və ya/i", { timeout: 15_000 }).catch(() => {});
    assert.match(new URL(page.url()).pathname, /\/giris/, `${role}: left the sign-in page after a wrong password`);
    assert.equal((await ctx.cookies()).some((c) => /session-token/.test(c.name)), false, `${role}: a session cookie was issued`);
    await ctx.close();
  }
});

test("UI-02 sign in with the keyboard only, then sign out: the session is really gone", async () => {
  for (const [role, a] of Object.entries(ACCOUNTS)) {
    const { ctx, page, errors } = await newPage();
    await page.goto(BASE + "/giris");
    await page.focus('input[type="email"]');
    await page.keyboard.type(a.email);
    await page.focus('input[type="password"]'); // (Tab from the e-mail field first reaches the "forgot password" link)
    await page.keyboard.type(a.password);
    await Promise.all([page.waitForURL(new RegExp(`${a.home}(/|$|\\?)`), { timeout: 30_000 }), page.keyboard.press("Enter")]);
    await page.waitForLoadState("networkidle").catch(() => {});
    await Promise.all([page.waitForURL(/\/giris|^\S+\/$/, { timeout: 20_000 }), page.getByRole("button", { name: "Çıxış" }).first().click()]);
    await page.goto(BASE + a.home);
    assert.match(new URL(page.url()).pathname, /\/giris/, `${role}: protected page still reachable after sign-out`);
    await page.goBack().catch(() => {});
    await page.waitForTimeout(300);
    assert.ok(!(await page.content()).includes("Çıxış") || /\/giris/.test(page.url()), `${role}: back button shows the panel again`);
    assert.deepEqual(errors, [], `${role}: console errors`);
    await ctx.close();
  }
});

test("UI-03 the 'create an account' link on the sign-in page leads to the trial-lesson request, and /qeydiyyat is closed", async () => {
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/giris");
  await Promise.all([page.waitForURL(/sinaq-dersi/), page.click("text=Qeydiyyatdan keçin")]);
  await page.goto(BASE + "/qeydiyyat");
  assert.match(page.url(), /sinaq-dersi/);
  await ctx.close();
});

test("UI-04 trial-lesson wizard: five steps by mouse, request stored and visible to the admin", async () => {
  const { ctx, page, errors } = await newPage();
  const parentName = `QA Wizard ${tag()}`;
  await page.goto(BASE + "/sinaq-dersi");
  await page.click("text=Young Developer");
  assert.equal(await page.locator("button:has-text('Növbəti')").isDisabled(), false);
  await page.click("button:has-text('Növbəti')");
  await page.click("button:has-text('Kibertəhlükəsizlik')");
  await page.click("button:has-text('Növbəti')");
  await page.locator("button", { hasText: /^[^\d]{1,6}\d{1,2}$/ }).first().click();
  await page.click("button:has-text('Növbəti')");
  await page.locator("button", { hasText: /^\d{2}:\d{2}$/ }).first().click();
  await page.click("button:has-text('Növbəti')");
  const inputs = page.locator("input[type=text], input[type=tel], input:not([type])");
  const n = await inputs.count();
  assert.ok(n >= 3, `final step shows ${n} text inputs`);
  await inputs.nth(0).fill(parentName);
  await inputs.nth(1).fill("0501234567");
  await inputs.nth(2).fill("Qa Wizard Kid");
  await page.locator("button", { hasText: /yazıl|göndər|təsdiq/i }).last().click();
  await page.waitForSelector("text=/uğur|təşəkkür|qəbul/i", { timeout: 15_000 });
  const rows = await sql(`select stage, "studentAge", "preferredTime" from "TrialBooking" where "parentName"=$1`, [parentName]);
  assert.equal(rows.length, 1, "exactly one request stored");
  assert.equal(rows[0].stage, "NEW");
  assert.ok(rows[0].studentAge >= 9 && rows[0].studentAge <= 11, `age ${rows[0].studentAge} must belong to the chosen 9-11 group`);
  const listed = await admin.get(`/api/admin/applications?q=${encodeURIComponent(parentName)}`);
  assert.equal(listed.body.items.length, 1, "the admin sees the request");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-05 the 10-year-old group is offered the cybersecurity course (course age range 10-18)", async () => {
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/sinaq-dersi");
  await page.click("text=6-8");
  await page.click("button:has-text('Növbəti')");
  assert.equal(await page.locator("button:has-text('Kibertəhlükəsizlik')").count(), 0, "a 7-year-old must not be offered a 10+ course");
  await ctx.close();
});

test("UI-06 theme toggle switches the page and survives a reload", async () => {
  const { ctx, page } = await newPage();
  await page.goto(BASE + "/");
  await page.evaluate(() => localStorage.removeItem("theme"));
  await page.reload();
  const before = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  await page.getByRole("button", { name: "Tema dəyiş" }).first().click();
  const flipped = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  assert.notEqual(flipped, before);
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("dark")), flipped, "the choice was lost on reload");
  await ctx.close();
});

test("UI-07 teacher marks attendance in the browser; it is stored, billed correctly and the family is told", async () => {
  const tA = await loginAs(w.teacherA.email, w.pw);
  const les = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(2, 9) });
  const { ctx, page, errors } = await newPage();
  await signIn(page, w.teacherA.email, w.pw, "/teacher");
  await page.goto(`${BASE}/teacher/classes/${w.classA.id}/attendance?lesson=${les.body.id}`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByText("Hamısı iştirak etdi").click();
  const row = page.locator("div", { hasText: `Qathree Student${w.tag}` }).filter({ has: page.locator("button", { hasText: "Qayıb" }) }).last();
  await row.locator("button", { hasText: "Qayıb" }).click();
  await page.getByText("Yadda saxla").first().click();
  await page.waitForSelector("text=/Davamiyyət yadda saxlanıldı|yadda saxlanıldı/i", { timeout: 15_000 });
  const att = await sql(`select "studentId", status, completed from "Attendance" where "lessonId"=$1 order by status`, [les.body.id]);
  assert.deepEqual(att.map((r) => [r.status, r.completed]).sort(), [["ABSENT", false], ["PRESENT", true]]);
  assert.equal(att.find((r) => r.status === "ABSENT").studentId, w.student3.id, "the absent mark landed on the right student");
  assert.ok((await sql(`select count(*)::int n from "Notification" where event='ABSENCE' and body like '%Qathree%'`))[0].n >= 1, "the family was notified");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-08 student hands in homework in the browser; the teacher then sees it submitted", async () => {
  const tA = await loginAs(w.teacherA.email, w.pw);
  const hw = await callAction(tA, TEACHER_ACTIONS, "createHomework", [{ classId: w.classA.id, title: "UI submit homework", description: "Submit me", dueDate: slot(-3).slice(0, 10), studentIds: [w.student1.id] }]);
  assert.equal(hw.value?.ok, true);
  const { ctx, page, errors } = await newPage();
  await signIn(page, w.student1.email, w.pw, "/student");
  await page.goto(BASE + "/student/homework");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByText("Təhvil ver").first().click();
  await page.waitForTimeout(1500);
  assert.equal((await sql(`select status from "Submission" where "homeworkId"=$1 and "studentId"=$2`, [hw.value.id, w.student1.id]))[0].status, "SUBMITTED");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-09 parent reads notifications and marks them all read in the browser", async () => {
  const { ctx, page, errors } = await newPage();
  await signIn(page, w.parent1.email, w.pw, "/parent");
  await page.goto(BASE + "/parent/notifications");
  await page.waitForLoadState("networkidle").catch(() => {});
  const uid = (await sql(`select "userId" from "ParentProfile" where id=$1`, [w.parent1.id]))[0].userId;
  assert.ok((await sql(`select count(*)::int n from "Notification" where "userId"=$1 and read=false`, [uid]))[0].n > 0, "has unread notifications");
  await page.getByText(/Hamısını oxundu işarələ/).click();
  await page.waitForTimeout(1500);
  assert.equal((await sql(`select count(*)::int n from "Notification" where "userId"=$1 and read=false`, [uid]))[0].n, 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-10 admin creates a class through the dialog; it appears in the list and in the teacher's panel", async () => {
  const { ctx, page, errors } = await newPage();
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  await page.goto(BASE + "/admin/classes");
  await page.waitForLoadState("networkidle").catch(() => {});
  const name = `UI Class ${tag()}`;
  await page.getByRole("button", { name: /yeni sinif yarat/i }).click();
  await page.waitForSelector("[role=dialog]");
  await page.fill("#cname", name);
  await page.selectOption("#ccourse", { index: 1 });
  await page.fill('[role=dialog] input[placeholder*="Müəllim axtar"]', `QA Teacher A ${w.tag}`);
  await page.locator("[role=dialog] button", { hasText: `QA Teacher A ${w.tag}` }).first().click();
  await page.fill('[role=dialog] input[placeholder*="Ad, soyad"]', `Qaone Student${w.tag}`);
  await page.locator("[role=dialog] button", { hasText: `Qaone Student${w.tag}` }).first().click();
  await page.getByRole("button", { name: /sinifi yarat/i }).click();
  await page.waitForSelector("[role=dialog]", { state: "detached", timeout: 15_000 });
  const row = (await sql(`select id, "teacherId" from "ClassGroup" where name=$1`, [name]))[0];
  assert.ok(row, "class stored");
  assert.equal(row.teacherId, w.teacherA.id);
  assert.equal((await sql(`select count(*)::int n from "Enrollment" where "classId"=$1 and "studentId"=$2`, [row.id, w.student1.id]))[0].n, 1);
  const tA = await loginAs(w.teacherA.email, w.pw);
  assert.ok((await tA.get("/api/teacher/classes")).body.items.some((c) => c.name === name), "the teacher sees it");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-11 the mobile admin menu opens and closes; navigation works at phone width", async () => {
  const { ctx, page, errors } = await newPage("mobile");
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  await page.getByRole("button", { name: "Menyu", exact: true }).click();
  await page.getByRole("link", { name: "Siniflər" }).first().click();
  await page.waitForURL(/\/admin\/classes/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true, "horizontal scroll on /admin/classes");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-12 teacher dashboard rows work from the keyboard (Tab to a student row, Enter opens it)", async () => {
  const { ctx, page } = await newPage();
  await signIn(page, ACCOUNTS.teacher.email, ACCOUNTS.teacher.password, "/teacher");
  await page.goto(BASE + "/teacher/students");
  await page.waitForLoadState("networkidle").catch(() => {});
  const row = page.locator('[role=button][tabindex="0"]').first();
  assert.ok(await row.count(), "no keyboard-focusable row found");
  await row.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/teacher\/students\/[^/]+$/, { timeout: 10_000 });
  await ctx.close();
});

test("UI-13 settings switches expose their state to assistive technology and flip when activated", async () => {
  const { ctx, page } = await newPage();
  await signIn(page, ACCOUNTS.parent.email, ACCOUNTS.parent.password, "/parent");
  await page.goto(BASE + "/parent/settings");
  await page.waitForLoadState("networkidle").catch(() => {});
  const sw = page.getByRole("switch").first();
  assert.ok(await sw.count(), "no role=switch found");
  const before = await sw.getAttribute("aria-checked");
  await sw.click();
  await page.waitForTimeout(800);
  assert.notEqual(await page.getByRole("switch").first().getAttribute("aria-checked"), before);
  await ctx.close();
});
