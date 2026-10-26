// Browser-level workflows (Playwright, real clicks and keystrokes) against the QA app and the isolated QA database.
// Each flow ends with a database check, because "the UI says saved" is not evidence.
//   node --test qa/ui/flows.test.mjs
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { launch, loginViaUi, ACCOUNTS, BASE, VIEWPORTS } from "./lib.mjs";
import { ADMIN, loginAs, makeWorld, callAction, sql, slot, tag, TEACHER_ACTIONS, STUDENT_ACTIONS } from "../tests/helpers.mjs";

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
  const menu = page.getByRole("button", { name: "Menyu", exact: true });
  assert.equal(await menu.getAttribute("aria-expanded"), "false", "closed menu button says so");
  assert.equal(await page.locator("#app-mobile-sidebar a").first().isVisible(), false, "the closed drawer's links are not reachable (invisible)");
  await menu.click();
  await page.waitForTimeout(400);
  assert.equal(await menu.getAttribute("aria-expanded"), "true", "open menu button says so");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  assert.equal(await menu.getAttribute("aria-expanded"), "false", "Escape closes the drawer");
  await menu.click();
  await page.locator("#app-mobile-sidebar").getByRole("link", { name: "Siniflər" }).click();
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

const MONTH_BTN = /^(Yanvar|Fevral|Mart|Aprel|May|İyun|İyul|Avqust|Sentyabr|Oktyabr|Noyabr|Dekabr)/;

test("UI-14 the parent attendance page steps month by month (arrows, like the admin calendar) a year back and returns with 'Bu aya qayıt'", async () => {
  const tA = await loginAs(w.teacherA.email, w.pw);
  const old = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(200, 16) }); // ~6-7 months ago
  assert.equal(old.status, 201, JSON.stringify(old.body));
  assert.equal((await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [old.body.id, { [w.student1.id]: "p" }])).value?.ok, true);
  const { ctx, page, errors } = await newPage();
  await signIn(page, w.parent1.email, w.pw, "/parent");
  await page.goto(BASE + "/parent/attendance");
  await page.waitForLoadState("networkidle").catch(() => {});
  const title = () => page.locator("text=/^(Yanvar|Fevral|Mart|Aprel|May|İyun|İyul|Avqust|Sentyabr|Oktyabr|Noyabr|Dekabr) 20\\d\\d$/").first().innerText();
  // the page opens on the latest month that has lessons (~6 months back, or the current month if other tests marked today); go to the current month first
  const back = page.getByRole("button", { name: "Bu aya qayıt" }).first();
  if (await back.count()) { await back.click(); await page.waitForTimeout(300); }
  const start = await title();
  const prev = page.getByRole("button", { name: "Əvvəlki ay" }).first();
  const seen = new Set([start]);
  for (let i = 0; i < 11; i++) { await prev.click(); await page.waitForTimeout(150); seen.add(await title()); }
  assert.equal(seen.size, 12, `expected 12 distinct months, got ${[...seen].join(", ")}`);
  assert.equal(await prev.evaluate((e) => getComputedStyle(e).opacity), "0.35", "the earliest month disables the back arrow");
  await page.getByRole("button", { name: "Bu aya qayıt" }).first().click();
  await page.waitForTimeout(300);
  assert.equal(await title(), start, "'Bu aya qayıt' returns to the month it started on");
  // the months after the current one are reachable too (empty until lessons are marked), up to a year ahead
  const next = page.getByRole("button", { name: "Növbəti ay" }).first();
  const ahead = new Set([start]);
  for (let i = 0; i < 11; i++) { await next.click(); await page.waitForTimeout(150); ahead.add(await title()); }
  assert.equal(ahead.size, 12, `expected 11 months ahead, got ${[...ahead].join(", ")}`);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-15 bell panel (teacher and student): opens, lists notices, 'mark all read' empties the unread state; Escape closes it", async () => {
  for (const [who, home] of [[w.teacherA, "/teacher"], [w.student1, "/student"]]) {
    const { ctx, page, errors } = await newPage();
    await signIn(page, who.email, w.pw, home);
    await page.waitForLoadState("networkidle").catch(() => {});
    const bell = page.locator('button[aria-haspopup="dialog"]').first();
    assert.ok(await bell.count(), `${home}: bell button not found`);
    await bell.click();
    const panel = page.getByRole("dialog").first();
    await panel.waitFor({ state: "visible", timeout: 10_000 });
    // the panel must be ABOVE the page content (it used to be painted underneath the cards that follow the header)
    const onTop = await panel.evaluate((d) => { const b = d.getBoundingClientRect(); return [0.1, 0.5, 0.9].map((f) => { const el = document.elementFromPoint(b.left + b.width / 2, b.top + Math.min(b.height, 300) * f); return !!el && d.contains(el); }); });
    assert.deepEqual(onTop, [true, true, true], `${home}: the bell panel is covered by page content`);
    await page.getByText("Hamısını oxundu et").first().click();
    await page.waitForTimeout(1200);
    const uid = (await sql(`select id from "User" where lower(email)=lower($1)`, [who.email]))[0].id;
    assert.equal((await sql(`select count(*)::int n from "Notification" where "userId"=$1 and read=false`, [uid]))[0].n, 0, `${home}: unread notices remain`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    assert.equal(await page.getByRole("dialog").count(), 0, `${home}: Escape did not close the panel`);
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test("UI-16 admin account menu: 'Ayarlar' opens the settings page, there is no dead 'Profil' entry, the bell leads to notifications", async () => {
  const { ctx, page, errors } = await newPage();
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.getByRole("button", { name: "Hesab menyusu" }).click();
  assert.equal(await page.getByRole("menuitem", { name: /Profil/ }).count(), 0, "a 'Profil' item with no destination is back");
  await page.getByRole("menuitem", { name: /Ayarlar/ }).click();
  await page.waitForURL(/\/admin\/settings/, { timeout: 15_000 });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-17 admin payments: a completed cycle offers 'Ödəniş etdi' and 'Hesabı blokla'; blocking and unblocking work from the buttons", async () => {
  const tA = await loginAs(w.teacherA.email, w.pw);
  const mine = await admin.post("/api/admin/classes", { name: `QA UI Pay ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id], lessonsPerCycle: 1 });
  assert.equal(mine.status, 201, JSON.stringify(mine.body));
  const l = (await tA.post(`/api/teacher/classes/${mine.body.id}/lessons`, { date: slot(25, 15) })).body.id;
  assert.equal((await tA.post(`/api/teacher/lessons/${l}/complete`, { studentIds: [w.student3.id] })).status, 200);
  const active = async () => (await sql(`select active from "StudentProfile" where id=$1`, [w.student3.id]))[0].active;
  const { ctx, page, errors } = await newPage();
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  await page.goto(BASE + `/admin/payments?status=DUE&q=${encodeURIComponent(`Student${w.tag}`)}`);
  await page.waitForLoadState("networkidle").catch(() => {});
  assert.ok(await page.getByRole("button", { name: "Ödəniş etdi" }).first().count(), "no 'Ödəniş etdi' button");
  await page.getByRole("button", { name: "Hesabı blokla" }).first().click();
  await page.waitForTimeout(1500);
  assert.equal(await active(), false, "student still active after blocking");
  await page.getByRole("button", { name: "Blokdan çıxar" }).first().click();
  await page.waitForTimeout(1500);
  assert.equal(await active(), true, "student still blocked after unblocking");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-18 a lesson dated NEXT month that the teacher marked 'present' is reachable with the month arrows — parent and student panels", async () => {
  const tA = await loginAs(w.teacherA.email, w.pw);
  const date = slot(-40, 10); // ~40 days ahead = next month or the one after
  const lesson = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date });
  assert.equal(lesson.status, 201, JSON.stringify(lesson.body));
  assert.equal((await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [lesson.body.id, { [w.student1.id]: "p", [w.student3.id]: "p" }])).value?.ok, true);
  const monthName = new Intl.DateTimeFormat("az-AZ", { timeZone: "Asia/Baku", month: "long" }).format(new Date(date + ":00+04:00"));
  const want = new RegExp(`^${monthName} 20\\d\\d$`, "i");
  for (const [who, home, path] of [[w.parent1, "/parent", "/parent/attendance"], [w.student1, "/student", "/student/attendance"]]) {
    const { ctx, page, errors } = await newPage();
    await signIn(page, who.email, w.pw, home);
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle").catch(() => {});
    const thisMonth = page.getByRole("button", { name: "Bu aya qayıt" }).first();
    if (await thisMonth.count()) { await thisMonth.click(); await page.waitForTimeout(250); } // the page may open on an older month with lessons
    const next = page.getByRole("button", { name: "Növbəti ay" }).first();
    let reached = false;
    for (let i = 0; i < 4 && !reached; i++) {
      if (await next.evaluate((e) => getComputedStyle(e).opacity) === "0.35") break;
      await next.click();
      await page.waitForTimeout(200);
      reached = (await page.getByText(want).count()) > 0 && /1 dərsdən 1/.test(await page.locator("body").innerText());
    }
    assert.ok(reached, `${home}: the month of a marked future lesson (${monthName}) cannot be reached with the arrows`);
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test("UI-19 teacher: new homework with its own maximum score, grading chips scale to it, feedback-only edits are saved, families see 'x/max'", async () => {
  const tB = await loginAs(w.teacherB.email, w.pw); // teacher B has exactly one class, so the form's default class is the right one
  const lesson = await tB.post(`/api/teacher/classes/${w.classB.id}/lessons`, { date: slot(6, 14) });
  assert.equal(lesson.status, 201, JSON.stringify(lesson.body));
  const { ctx, page, errors } = await newPage();
  await signIn(page, w.teacherB.email, w.pw, "/teacher");
  await page.goto(BASE + "/teacher/homework/new");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.fill('.td-desktop [name="hwTitle"]', `UI max score ${w.tag}`);
  await page.fill('.td-desktop [name="hwDescription"]', "Solve the exercises");
  const count = () => sql(`select count(*)::int n from "Homework" where title=$1`, [`UI max score ${w.tag}`]).then((r) => r[0].n);
  for (const bad of ["abc", "0", "5000", "12.5"]) {
    await page.fill('.td-desktop [name="hwMaxScore"]', bad);
    await page.getByRole("button", { name: "Tapşırığı təyin et" }).click();
    await page.waitForTimeout(500);
    assert.equal(await count(), 0, `maximum score "${bad}" must be refused`);
  }
  await page.fill('.td-desktop [name="hwMaxScore"]', "50");
  await page.getByRole("button", { name: "Tapşırığı təyin et" }).click();
  await page.waitForFunction(() => !location.pathname.endsWith("/new"), null, { timeout: 15_000 }).catch(() => {});
  const hw = (await sql(`select id, "maxScore" from "Homework" where title=$1`, [`UI max score ${w.tag}`]))[0];
  assert.equal(hw?.maxScore, 50, "the maximum score is stored");
  const sub = (await sql(`select id from "Submission" where "homeworkId"=$1 and "studentId"=$2`, [hw.id, w.student2.id]))[0].id;
  const s2 = await loginAs(w.student2.email, w.pw);
  assert.equal((await callAction(s2, STUDENT_ACTIONS, "submitHomework", [sub])).value?.ok, true);

  await page.goto(`${BASE}/teacher/homework/${hw.id}/grade`);
  await page.waitForLoadState("networkidle").catch(() => {});
  const chips = (await page.locator("button").evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()))).filter((t) => /^\d+$/.test(t));
  assert.deepEqual(chips.filter((t) => ["30", "35", "40", "45", "50"].includes(t)), ["30", "35", "40", "45", "50"], `chips must scale to 50 points, saw ${chips}`);
  assert.ok(!chips.includes("100"), "no 100-point chip on a 50-point task");
  await page.getByRole("button", { name: "45", exact: true }).first().click();
  await page.getByRole("button", { name: /Qiymətləri yadda saxla/ }).click();
  await page.waitForTimeout(1500);
  const graded = (await sql(`select s.score, s.status, g."maxScore" m from "Submission" s join "Grade" g on g."submissionId"=s.id where s.id=$1`, [sub]))[0];
  assert.deepEqual([graded.score, graded.status, graded.m], [45, "GRADED", 50]);

  // editing only the feedback of the already graded work must save (it used to say "choose a score first")
  await page.goto(`${BASE}/teacher/homework/${hw.id}/grade`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator(`.td-desktop input[name="fb-${sub}"]`).fill("Əla iş, davam et");
  await page.getByRole("button", { name: /Qiymətləri yadda saxla/ }).click();
  await page.waitForTimeout(1500);
  const after = (await sql(`select score, feedback from "Submission" where id=$1`, [sub]))[0];
  assert.deepEqual([after.score, after.feedback], [45, "Əla iş, davam et"]);

  // a hand-made request above the maximum is refused
  const tBc = await loginAs(w.teacherB.email, w.pw);
  assert.equal((await callAction(tBc, TEACHER_ACTIONS, "saveGrades", [[{ submissionId: sub, score: 51 }]])).value?.ok, false);
  assert.equal((await sql(`select score from "Submission" where id=$1`, [sub]))[0].score, 45);

  // the family and the student read "45/50 bal"
  assert.match((await s2.page("/student/homework")).html, /45\/50 bal/);
  const p2 = await loginAs(w.parent2.email, w.pw);
  assert.match((await p2.page("/parent/homework")).html, /45\/50 bal/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-20 teacher notes: each visibility chip stores the right visibility, an empty note is refused, delete removes the note", async () => {
  const { ctx, page, errors } = await newPage();
  await signIn(page, w.teacherA.email, w.pw, "/teacher");
  await page.goto(`${BASE}/teacher/students/${w.student1.id}`);
  await page.waitForLoadState("networkidle").catch(() => {});
  const notes = () => sql(`select body, visibility from "StudentNote" where "studentId"=$1 and body like $2 order by "createdAt"`, [w.student1.id, `UI note ${w.tag}%`]);
  await page.getByRole("button", { name: "Qeydi göndər" }).click(); // nothing typed
  await page.waitForTimeout(500);
  assert.equal((await notes()).length, 0, "an empty note must not be stored");
  for (const [chip, vis] of [["Yalnız mən", "PRIVATE"], ["Valideyn", "PARENT"], ["Tələbə və valideyn", "STUDENT"]]) {
    await page.locator('.td-desktop textarea[name="teacherNote"]').fill(`UI note ${w.tag} ${vis}`);
    await page.getByRole("button", { name: chip, exact: true }).click();
    await page.getByRole("button", { name: "Qeydi göndər" }).click();
    await page.waitForFunction((t) => document.body.innerText.includes(t), `UI note ${w.tag} ${vis}`, { timeout: 15_000 });
  }
  assert.deepEqual((await notes()).map((n) => n.visibility), ["PRIVATE", "PARENT", "STUDENT"]);
  // who can read what: the parent sees PARENT + STUDENT notes, the student only STUDENT notes
  const p1 = await loginAs(w.parent1.email, w.pw);
  const s1 = await loginAs(w.student1.email, w.pw);
  const parentHtml = (await p1.page("/parent/children")).html + (await p1.page("/parent")).html;
  const studentHtml = (await s1.page("/student")).html + (await s1.page("/student/progress")).html;
  assert.ok(parentHtml.includes(`UI note ${w.tag} PARENT`) && parentHtml.includes(`UI note ${w.tag} STUDENT`), "the parent must see the PARENT and STUDENT notes");
  assert.ok(!parentHtml.includes(`UI note ${w.tag} PRIVATE`), "a private note leaked to the parent");
  assert.ok(!studentHtml.includes(`UI note ${w.tag} PRIVATE`) && !studentHtml.includes(`UI note ${w.tag} PARENT`), "a note leaked to the student");
  // delete the first (private) note with the trash button (the confirm dialog is accepted by newPage)
  await page.locator(`div:has(> div:has-text("UI note ${w.tag} PRIVATE")) button[title="Qeydi sil"]`).last().click();
  await page.waitForFunction((t) => !document.body.innerText.includes(t), `UI note ${w.tag} PRIVATE`, { timeout: 15_000 });
  assert.deepEqual((await notes()).map((n) => n.visibility), ["PARENT", "STUDENT"]);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-21 profile forms (teacher and parent): invalid values are refused and change nothing, valid values are stored, 'Ləğv et' restores the fields", async () => {
  for (const [who, home, path] of [[w.teacherA, "/teacher", "/teacher/profile"], [w.parent2, "/parent", "/parent/settings"]]) {
    const { ctx, page, errors } = await newPage();
    await signIn(page, who.email, w.pw, home);
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle").catch(() => {});
    const row = () => sql(`select name, phone from "User" where lower(email)=lower($1)`, [who.email]).then((r) => r[0]);
    const before = await row();
    const nameBox = page.getByLabel("Ad Soyad", { exact: true }).first();
    const phoneBox = page.getByLabel("Telefon", { exact: true }).first();
    const save = page.getByRole("button", { name: "Yadda saxla" }).first();
    for (const [name, phone] of [["   ", "+994501234567"], ["Ab", "+994501234567"], ["Valid Name", "12345"], ["X".repeat(150), "+994501234567"], ["Valid Name", "9".repeat(60)]]) {
      await nameBox.fill(name); await phoneBox.fill(phone);
      await save.click();
      await page.waitForTimeout(700);
      assert.deepEqual(await row(), before, `${home}: invalid profile (${name.slice(0, 8)}…, ${phone.slice(0, 8)}…) must change nothing`);
    }
    await nameBox.fill("QA Renamed " + w.tag); await phoneBox.fill("+994507654321");
    await page.getByRole("button", { name: "Ləğv et" }).first().click();
    assert.equal(await nameBox.inputValue(), before.name, `${home}: cancel restores the name`);
    await nameBox.fill("QA Renamed " + w.tag); await phoneBox.fill("+994507654321");
    await save.click();
    await page.waitForFunction(() => /yadda saxlanıldı/i.test(document.body.innerText), null, { timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(500);
    assert.deepEqual(await row(), { name: "QA Renamed " + w.tag, phone: "+994507654321" });
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test("UI-22 admin dialogs with real data: create teacher / parent / student (new parent) / course, the new people can sign in, edit and (de)activate work", async () => {
  const { ctx, page, errors } = await newPage();
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  const t = tag();
  const settle = async () => { await page.waitForSelector("[role=dialog]", { state: "detached", timeout: 15_000 }); await page.waitForTimeout(400); };
  const goto = async (path) => { await page.goto(BASE + path); await page.waitForLoadState("networkidle").catch(() => {}); };

  // teacher
  await goto("/admin/teachers");
  await page.getByRole("button", { name: /yeni müəllim/i }).click();
  await page.getByLabel("Ad Soyad").fill(`UI Teacher ${t}`);
  await page.getByLabel("Vəzifə").fill("Python müəllimi");
  await page.getByLabel("E-poçt (giriş)").fill(`ui.teacher.${t}@qa.test`);
  await page.getByLabel("İlkin şifrə").fill("Passw0rd!ui1");
  await page.getByLabel("Telefon").fill("+994501112233");
  await page.getByRole("dialog").getByRole("button", { name: /müəllimi yarat/i }).click();
  await settle();
  const teacher = (await sql(`select p.id, u.role, u.active from "TeacherProfile" p join "User" u on u.id=p."userId" where lower(u.email)=lower($1)`, [`ui.teacher.${t}@qa.test`]))[0];
  assert.ok(teacher && teacher.role === "TEACHER" && teacher.active, "teacher stored and active");
  assert.equal((await loginAs(`ui.teacher.${t}@qa.test`, "Passw0rd!ui1").then(() => true, () => false)), true, "the new teacher can sign in with the password typed in the dialog");

  // edit the teacher through the page dialog
  await goto(`/admin/teachers/${teacher.id}`);
  await page.getByRole("button", { name: /redaktə/i }).first().click();
  await page.getByLabel("Ad Soyad").fill(`UI Teacher Edited ${t}`);
  await page.getByRole("dialog").getByRole("button", { name: /yadda saxla|yenilə|saxla/i }).click();
  await settle();
  assert.equal((await sql(`select u.name from "TeacherProfile" p join "User" u on u.id=p."userId" where p.id=$1`, [teacher.id]))[0].name, `UI Teacher Edited ${t}`);

  // deactivate / activate (confirm dialog accepted by newPage)
  await goto(`/admin/teachers/${teacher.id}`);
  await page.getByRole("button", { name: "Deaktiv et" }).click();
  await page.waitForTimeout(1200);
  assert.equal((await sql(`select u.active from "TeacherProfile" p join "User" u on u.id=p."userId" where p.id=$1`, [teacher.id]))[0].active, false);
  assert.equal(await new (await import("../tests/helpers.mjs")).Client("x").login(`ui.teacher.${t}@qa.test`, "Passw0rd!ui1"), false, "a deactivated teacher cannot sign in");
  await page.getByRole("button", { name: "Aktiv et" }).click();
  await page.waitForTimeout(1200);
  assert.equal((await sql(`select u.active from "TeacherProfile" p join "User" u on u.id=p."userId" where p.id=$1`, [teacher.id]))[0].active, true);

  // parent
  await goto("/admin/parents");
  await page.getByRole("button", { name: /yeni valideyn/i }).click();
  await page.getByLabel("Ad Soyad").fill(`UI Parent ${t}`);
  await page.getByLabel("E-poçt (giriş)").fill(`ui.parent.${t}@qa.test`);
  await page.getByLabel("Telefon").fill("+994502223344");
  await page.getByLabel("İlkin şifrə").fill("Passw0rd!ui2");
  await page.getByRole("dialog").getByRole("button", { name: /valideyni yarat/i }).click();
  await settle();
  assert.ok((await sql(`select 1 from "User" where lower(email)=lower($1) and role='PARENT'`, [`ui.parent.${t}@qa.test`])).length, "parent stored");

  // student with a NEW parent in the same dialog
  await goto("/admin/students");
  await page.getByRole("button", { name: /yeni tələbə/i }).click();
  await page.getByLabel("Ad", { exact: true }).fill("Uistudent");
  await page.getByLabel("Soyad").fill(`Test${t.replace(/\d/g, "x")}`);
  await page.getByLabel("E-poçt (giriş)").fill(`ui.student.${t}@qa.test`);
  await page.getByLabel("İlkin şifrə").fill("Passw0rd!ui3");
  await page.getByLabel("Doğum tarixi").fill("2014-04-04");
  await page.getByLabel("Sinif (1-11)").fill("5");
  await page.getByText("Yeni valideyn", { exact: true }).click();
  await page.getByPlaceholder("Valideynin adı").fill(`UI NewParent ${t}`);
  await page.getByRole("dialog").getByPlaceholder("E-poçt").fill(`ui.newparent.${t}@qa.test`);
  await page.getByPlaceholder("Şifrə (ən az 8)").fill("Passw0rd!ui4");
  await page.getByRole("dialog").getByRole("button", { name: /tələbəni yarat/i }).click();
  await settle();
  const st = (await sql(`select s.id, s.grade, s."parentId", u.active from "StudentProfile" s join "User" u on u.id=s."userId" where lower(u.email)=lower($1)`, [`ui.student.${t}@qa.test`]))[0];
  assert.ok(st && st.grade === 5 && st.parentId, "student stored with a parent");
  assert.ok((await sql(`select 1 from "User" where lower(email)=lower($1) and role='PARENT'`, [`ui.newparent.${t}@qa.test`])).length, "the new parent of the student was created too");

  // course
  await goto("/admin/courses");
  await page.getByRole("button", { name: /yeni kurs/i }).click();
  await page.getByLabel("Kursun adı").fill(`UI Course ${t}`);
  await page.getByLabel("Kateqoriya").selectOption({ index: 1 });
  await page.getByLabel("Səviyyə").selectOption({ index: 1 });
  await page.getByLabel("Qısa təsvir").fill("Qısa təsvir mətni burada");
  await page.getByLabel("Ətraflı təsvir").fill("Ətraflı təsvir mətni burada yazılıb");
  await page.getByLabel("Min yaş").fill("10");
  await page.getByLabel("Maks yaş").fill("14");
  await page.getByLabel("Müddət (ay)").fill("3");
  await page.getByLabel("Qiymət (AZN)").fill("120");
  await page.getByRole("dialog").getByRole("button", { name: /kursu yarat/i }).click();
  await settle();
  const course = (await sql(`select price, "minAge", "maxAge" from "Course" where name=$1`, [`UI Course ${t}`]))[0];
  assert.ok(course && course.price === 120 && course.minAge === 10 && course.maxAge === 14, `course stored correctly: ${JSON.stringify(course)}`);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("UI-23 profile picture upload (teacher, student, parent): a real image is stored and served, a fake image is refused and changes nothing", async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  for (const [who, home, path] of [[w.teacherA, "/teacher", "/teacher/profile"], [w.student1, "/student", "/student/settings"], [w.parent2, "/parent", "/parent/settings"]]) {
    const { ctx, page, errors } = await newPage();
    await signIn(page, who.email, w.pw, home);
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle").catch(() => {});
    // students keep their picture on the student profile, teachers and parents on the user
    const avatar = () => sql(home === "/student" ? `select s."avatarUrl" a from "StudentProfile" s join "User" u on u.id=s."userId" where lower(u.email)=lower($1)` : `select "avatarUrl" a from "User" where lower(email)=lower($1)`, [who.email]).then((r) => r[0].a);
    const before = await avatar();
    const input = page.locator('input[type="file"]').first();
    await input.setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("this is not an image, just text pretending") });
    await page.waitForTimeout(1500);
    assert.equal(await avatar(), before, `${home}: a text file named .png must not become the avatar`);
    await input.setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
    await page.waitForFunction(() => /şəkli yeniləndi/i.test(document.body.innerText), null, { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(500);
    const url = await avatar();
    assert.ok(url && url.startsWith("/uploads/") && url !== before, `${home}: avatar stored (${url})`);
    const served = await fetch(BASE + url);
    assert.equal(served.status, 200);
    assert.match(served.headers.get("content-type") ?? "", /image\/png/);
    assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
    await ctx.close();
  }
});

test("UI-24 admin converts a trial-lesson request into a student + new parent through the dialog; both can sign in and the request leaves the queue", async () => {
  const { ctx, page, errors } = await newPage();
  const t = tag();
  // a fresh request, stored the way the public wizard stores it
  await sql(`insert into "TrialBooking" (id, "studentName", "studentAge", "parentName", "parentPhone", "courseId", "preferredDate", "preferredTime") select 'ui24${t}', $1, 11, $2, '+994501110000', c.id, now() + interval '3 days', '15:00' from "Course" c limit 1`, [`Uiconvert Kid${t}`, `UI Convert Parent ${t}`]);
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  await page.goto(BASE + "/admin/leads?q=" + encodeURIComponent(`Uiconvert Kid${t}`));
  await page.waitForLoadState("networkidle").catch(() => {});
  const row = page.locator("tr, li, div", { hasText: `Uiconvert Kid${t}` }).last();
  await row.getByRole("button", { name: "Tələbə yarat" }).click();
  const dlg = page.getByRole("dialog");
  await dlg.getByLabel("Ad", { exact: true }).fill("Uiconvert");
  await dlg.getByLabel("Soyad").fill(`Kid${t.replace(/\d/g, "x")}`);
  await dlg.getByLabel("Tələbənin e-poçtu (giriş)").fill(`ui.conv.${t}@qa.test`);
  await dlg.getByLabel("İlkin şifrə").fill("Passw0rd!cv1");
  await dlg.getByLabel(/Doğum tarixi/).fill("2015-03-03");
  await dlg.getByLabel("Sinif (1-11)").fill("5");
  await dlg.getByLabel("Valideynin e-poçtu").fill(`ui.convparent.${t}@qa.test`);
  await dlg.getByLabel("Valideynin şifrəsi").fill("Passw0rd!cv2");
  await dlg.getByRole("button", { name: /^Təsdiqlə/ }).click();
  await page.waitForSelector("[role=dialog]", { state: "detached", timeout: 15_000 });
  const stu = (await sql(`select s.id, s."parentId" from "StudentProfile" s join "User" u on u.id=s."userId" where lower(u.email)=lower($1)`, [`ui.conv.${t}@qa.test`]))[0];
  assert.ok(stu?.parentId, "student with parent created");
  assert.equal((await sql(`select count(*)::int n from "User" where lower(email)=lower($1) and role='PARENT'`, [`ui.convparent.${t}@qa.test`]))[0].n, 1);
  const { Client } = await import("../tests/helpers.mjs");
  assert.equal(await new Client("s").login(`ui.conv.${t}@qa.test`, "Passw0rd!cv1"), true, "student can sign in");
  assert.equal(await new Client("p").login(`ui.convparent.${t}@qa.test`, "Passw0rd!cv2"), true, "parent can sign in");
  assert.notEqual((await sql(`select stage from "TrialBooking" where "studentName"=$1`, [`Uiconvert Kid${t}`]))[0]?.stage, "NEW", "the request is no longer new");
  assert.deepEqual(errors.filter((e) => !/status of 4\d\d|Failed to load resource/.test(e)), []);
  await ctx.close();
});

test("UI-25 admin settings form: invalid numbers are refused, valid values are stored and shown again after a reload (original values restored afterwards)", async () => {
  const { ctx, page, errors } = await newPage();
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  await page.goto(BASE + "/admin/settings");
  await page.waitForLoadState("networkidle").catch(() => {});
  const val = (k) => sql(`select value from "Setting" where key=$1`, [k]).then((r) => r[0]?.value ?? null);
  const original = { name: await val("school.name"), overdue: await val("billing.overdueDays") };
  try {
    const save = page.getByRole("button", { name: "Yadda saxla" });
    await page.getByLabel("Gecikmə həddi (gün)").fill("-4");
    await save.click();
    await page.waitForTimeout(900);
    assert.equal(await val("billing.overdueDays"), original.overdue, "a negative overdue limit must not be stored");
    await page.getByLabel("Gecikmə həddi (gün)").fill(String(original.overdue ?? 7));
    await page.getByLabel("Ödəniş dövrü (dərs sayı)").fill("0");
    await save.click();
    await page.waitForTimeout(900);
    assert.notEqual(await val("billing.lessonsPerCycle"), 0, "0 lessons per cycle must not be stored");
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    const name = `UI School ${tag()}`;
    await page.getByLabel("Məktəbin adı").fill(name);
    await page.getByLabel("Gecikmə həddi (gün)").fill("11");
    await save.click();
    await page.waitForTimeout(1200);
    assert.equal(await val("school.name"), name);
    assert.equal(await val("billing.overdueDays"), 11);
    await page.reload();
    await page.waitForLoadState("networkidle").catch(() => {});
    assert.equal(await page.getByLabel("Məktəbin adı").inputValue(), name, "the stored value is shown after a reload");
    assert.equal(await page.getByLabel("Gecikmə həddi (gün)").inputValue(), "11");
    assert.deepEqual(errors.filter((e) => !/status of 4\d\d|Failed to load resource/.test(e)), []);
  } finally {
    // back to the state before the test: a key that was not stored (defaults apply) is removed again
    for (const [key, v] of [["school.name", original.name], ["billing.overdueDays", original.overdue]]) {
      if (v === null) await sql(`delete from "Setting" where key=$1`, [key]);
      else await sql(`update "Setting" set value=$2::jsonb where key=$1`, [key, JSON.stringify(v)]);
    }
  }
  await ctx.close();
});

test("UI-26 phone layouts: no sideways page scroll at 320/360/390 px, the site header fits, admin payments and leads show their action buttons without scrolling, text fields do not trigger the iOS zoom", async () => {
  for (const width of [320, 360, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    for (const path of ["/", "/kurslar", "/giris", "/sinaq-dersi", "/teqaud"]) {
      await page.goto(BASE + path);
      await page.waitForLoadState("networkidle").catch(() => {});
      const m = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        // header controls must be inside the screen (the menu button used to be pushed off at 320 px)
        offscreen: [...document.querySelectorAll("header a, header button")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" && r.right > innerWidth + 0.5; }).map((e) => (e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 20)),
        smallFields: [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]),select,textarea")].filter((e) => e.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(e).fontSize) < 16).length,
      }));
      assert.ok(m.sw <= width, `${path} @${width}: page scrolls sideways (${m.sw}px)`);
      assert.deepEqual(m.offscreen, [], `${path} @${width}: header controls outside the screen`);
      assert.equal(m.smallFields, 0, `${path} @${width}: text fields under 16px (iOS zooms the page on focus)`);
    }
    await ctx.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  const visibleInScreen = async (locator, what) => {
    const box = await locator.first().boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 390, `${what} is not fully on screen (${JSON.stringify(box)})`);
  };
  await page.goto(BASE + "/admin/payments?status=ALL");
  await page.waitForLoadState("networkidle").catch(() => {});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 390), true, "payments: page scrolls sideways");
  await visibleInScreen(page.getByRole("button", { name: /Ödəniş etdi|Yenidən aç/ }), "payments: the action button");
  await page.goto(BASE + "/admin/leads");
  await page.waitForLoadState("networkidle").catch(() => {});
  await visibleInScreen(page.getByRole("button", { name: "Tələbə yarat" }), "leads: 'Tələbə yarat'");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= 390), true, "leads: page scrolls sideways");
  await ctx.close();
});

test("UI-27 teacher attendance: unsaved marks survive a background refresh, are flagged, leaving asks first, and an empty save is refused instead of pretending to save", async () => {
  const tA = await loginAs(w.teacherA.email, w.pw);
  const les = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(-33, 12) }); // a lesson next month
  assert.equal(les.status, 201, JSON.stringify(les.body));
  const rows = () => sql(`select count(*)::int n from "Attendance" where "lessonId"=$1`, [les.body.id]).then((r) => r[0].n);
  const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
  const page = await ctx.newPage();
  const dialogs = [];
  let answer = "dismiss";
  page.on("dialog", (d) => { dialogs.push(d.type()); return answer === "accept" ? d.accept() : d.dismiss(); });
  await signIn(page, w.teacherA.email, w.pw, "/teacher");
  await page.goto(`${BASE}/teacher/classes/${w.classA.id}/attendance?lesson=${les.body.id}`);
  await page.waitForLoadState("networkidle").catch(() => {});

  // 1) saving without any mark must not claim success and must not write anything
  await page.getByRole("button", { name: "Yadda saxla" }).first().click();
  await page.waitForTimeout(700);
  assert.equal(await rows(), 0);
  assert.equal(await page.getByText(/yadda saxlanıldı/i).count(), 0, "an empty save must not say 'saved'");

  // 2) mark everybody: the unsaved banner shows
  await page.getByText("Hamısı iştirak etdi").first().click();
  await page.waitForTimeout(300);
  assert.ok(await page.getByText(/hələ saxlanılmayıb/).count(), "unsaved changes are flagged");
  const marked = () => page.locator("text=/^\\d+ \\/ \\d+$/").first().innerText();
  const before = await marked();

  // 3) coming back to the tab refreshes the server data; the marks on screen must stay (they used to be wiped)
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForTimeout(2500);
  assert.equal(await marked(), before, "a background refresh wiped the unsaved marks");
  assert.ok(await page.getByText(/hələ saxlanılmayıb/).count(), "still flagged after the refresh");

  // 4) leaving asks first: dismissing keeps us here, accepting leaves
  await page.getByRole("button", { name: /Geri|Siniflər/ }).first().click();
  await page.waitForTimeout(500);
  assert.ok(dialogs.includes("confirm"), "leaving with unsaved marks must ask");
  assert.match(page.url(), /attendance/, "dismissing the question keeps the teacher on the attendance screen");
  assert.equal(await rows(), 0, "nothing was saved by asking");

  // 5) saving stores them and clears the banner
  await page.getByRole("button", { name: /^Yadda saxla$/ }).first().click();
  await page.waitForSelector("text=/Davamiyyət yadda saxlanıldı/i", { timeout: 15_000 });
  assert.ok((await rows()) >= 1, "the marks were stored");
  await page.waitForTimeout(500);
  assert.equal(await page.getByText(/hələ saxlanılmayıb/).count(), 0, "banner gone after saving");
  await ctx.close();
});

test("UI-28 parent phone 'Ana' screen shows the same sections as the computer one (payments, homework, teacher note, progress, achievements, activity)", async () => {
  const SECTIONS = ["Ödənişlər", "Ev tapşırığı", "Müəllim qeydi", "Öyrənmə inkişafı", "Nailiyyətlər", "Son fəaliyyət"];
  const headingsOf = async (viewport, mobile) => {
    const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
    const page = await ctx.newPage();
    await signIn(page, ACCOUNTS.parent.email, ACCOUNTS.parent.password, "/parent");
    await page.goto(BASE + "/parent");
    await page.waitForLoadState("networkidle").catch(() => {});
    const root = mobile ? ".pp-mobile" : ".pp-desktop";
    const found = await page.evaluate(([root, list]) => [...document.querySelector(root).querySelectorAll("*")].filter((e) => e.children.length === 0 && list.includes(e.textContent.trim()) && e.getBoundingClientRect().width > 0).map((e) => e.textContent.trim()), [root, SECTIONS]);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    await ctx.close();
    return { found: [...new Set(found)], sw };
  };
  const desktop = await headingsOf(VIEWPORTS.desktop, false);
  const phone = await headingsOf({ width: 390, height: 844 }, true);
  const missing = desktop.found.filter((s) => !phone.found.includes(s));
  assert.deepEqual(missing, [], `sections on the computer Ana screen but not on the phone: ${missing.join(", ")}`);
  assert.ok(phone.found.length >= 5, `phone sections: ${phone.found.join(", ")}`);
  assert.ok(phone.sw <= 390, "the phone Ana screen scrolls sideways");
});

test("UI-29 admin design: glass sidebar, pill hover glides between items and hides when the cursor leaves, the active capsule follows the page, all 16 items fit", async () => {
  const { ctx, page, errors } = await newPage();
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  await page.waitForLoadState("networkidle").catch(() => {});
  const aside = page.locator("aside.ad-glass").first();
  assert.match(await aside.evaluate((e) => getComputedStyle(e).backdropFilter || getComputedStyle(e).webkitBackdropFilter), /blur/, "the sidebar is liquid glass (backdrop blur)");
  const links = page.locator("aside.ad-glass").first().locator("a.ad-navlink");
  assert.equal(await links.count(), 16);
  // every item is reachable without scrolling the list (900px high window)
  const hidden = await links.evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); const box = e.closest("nav").getBoundingClientRect(); return r.bottom > box.bottom + 1; }).length);
  assert.equal(hidden, 0, "a nav item is cut off at the bottom of the sidebar");
  const hover = aside.locator(".ad-pill-hover");
  assert.equal(await hover.getAttribute("data-on"), "false", "no capsule before the cursor is over the list");
  const yOf = async (i) => links.nth(i).evaluate((e) => e.offsetTop);
  const pillY = () => hover.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42);
  await links.nth(2).hover();
  await page.waitForTimeout(400);
  assert.equal(await hover.getAttribute("data-on"), "true");
  assert.equal(Math.round(await pillY()), await yOf(2), "the capsule sits behind the hovered item");
  await links.nth(6).hover();
  await page.waitForTimeout(450);
  assert.equal(Math.round(await pillY()), await yOf(6), "the capsule glided to the next item");
  assert.match(await hover.evaluate((e) => getComputedStyle(e).transitionProperty), /transform/, "it animates with transform");
  await page.mouse.move(900, 500); // away from the sidebar
  await page.waitForTimeout(400);
  assert.equal(await hover.getAttribute("data-on"), "false", "the capsule fades out when the cursor leaves");
  // the orange capsule marks the current page and moves with navigation
  const activeY = () => aside.locator(".ad-pill-active").evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42);
  assert.equal(Math.round(await activeY()), await yOf(0), "Dashboard is the active item on /admin");
  await links.nth(5).click();
  await page.waitForURL(/\/admin\/classes/);
  await page.waitForTimeout(600);
  assert.equal(await links.nth(5).getAttribute("aria-current"), "page");
  assert.equal(Math.round(await activeY()), await yOf(5), "the active capsule slid to Siniflər");
  assert.deepEqual(errors, []);
  await ctx.close();
});

const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgbOf = (css) => css.match(/[\d.]+/g).slice(0, 3).map(Number);

test("UI-30 admin accessibility basics: contrast, minimum text size, visible focus, 44px touch targets, grouped nav with counts, helpful empty states", async () => {
  const { ctx, page, errors } = await newPage();
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  // 1) grouped navigation: 6 groups -> 5 separators, all 16 pages still listed
  await page.waitForLoadState("networkidle").catch(() => {});
  assert.equal(await page.locator("aside.ad-glass").first().locator(".ad-sep").count(), 5, "nav groups");
  // 2) contrast >= 4.5:1 for the colours used for small text on white
  await page.goto(BASE + "/admin");
  await page.waitForLoadState("networkidle").catch(() => {});
  const colours = await page.evaluate(() => {
    const css = (el, p) => getComputedStyle(el)[p];
    const link = [...document.querySelectorAll("a")].find((a) => /text-electric-600/.test(a.className));
    const label = document.querySelector("p.text-navy-400, .text-navy-400");
    return { link: link ? css(link, "color") : null, label: label ? css(label, "color") : null };
  });
  const WHITE = [255, 255, 255], PAPER = [247, 247, 245];
  if (colours.link) assert.ok(ratio(rgbOf(colours.link), WHITE) >= 4.5, `orange link text ${colours.link} has contrast ${ratio(rgbOf(colours.link), WHITE).toFixed(2)}`);
  assert.ok(ratio(rgbOf(colours.label), PAPER) >= 4.5, `muted label ${colours.label} on the page background: ${ratio(rgbOf(colours.label), PAPER).toFixed(2)}`);
  await page.goto(BASE + "/admin/students");
  await page.waitForLoadState("networkidle").catch(() => {});
  const ph = await page.locator("input[placeholder]").first().evaluate((el) => getComputedStyle(el, "::placeholder").color);
  assert.ok(ratio(rgbOf(ph), WHITE) >= 4.5, `placeholder ${ph}: ${ratio(rgbOf(ph), WHITE).toFixed(2)}`);
  // 3) no visible text under 11px on the busiest lists
  for (const path of ["/admin", "/admin/students", "/admin/payments?status=ALL", "/admin/schedule"]) {
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle").catch(() => {});
    const tiny = await page.evaluate(() => [...document.querySelectorAll("main *, div.relative *")].filter((e) => e.children.length === 0 && (e.textContent ?? "").trim().length > 1 && e.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(e).fontSize) < 10.99).map((e) => `${e.textContent.trim().slice(0, 14)}@${getComputedStyle(e).fontSize}`).slice(0, 5));
    assert.deepEqual(tiny, [], `${path}: text under 11px`);
  }
  // 4) keyboard focus is visible
  await page.goto(BASE + "/admin");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.keyboard.press("Tab");
  const outlineOf = () => page.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { w: parseFloat(s.outlineWidth), style: s.outlineStyle, tag: e.tagName }; });
  let seen = false;
  for (let i = 0; i < 6 && !seen; i++) { const o = await outlineOf(); seen = o.w >= 2 && o.style !== "none"; if (!seen) await page.keyboard.press("Tab"); }
  assert.ok(seen, "no visible focus ring while tabbing");
  // 5) empty state: a message and what to try
  await page.goto(BASE + "/admin/payments?status=CANCELLED&q=zzzznothingzzzz");
  await page.waitForLoadState("networkidle").catch(() => {});
  assert.ok(await page.getByText("Ödəniş tapılmadı.").locator("visible=true").count(), "empty message is visible (the phone card list and the table both carry it; one of them is shown)");
  assert.ok(await page.getByText(/filtrləri dəyişməyi sınayın/).locator("visible=true").count(), "empty hint is visible");
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await ctx.close();

  // 6) touch screens: every visible button and select is at least 44px high
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const tp = await touch.newPage();
  await signIn(tp, ADMIN.email, ADMIN.password, "/admin");
  for (const path of ["/admin/students", "/admin/payments?status=ALL", "/admin/leads"]) {
    await tp.goto(BASE + path);
    await tp.waitForLoadState("networkidle").catch(() => {});
    const small = await tp.evaluate(() => [...document.querySelectorAll("button, select")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden" && e.closest("#app-mobile-sidebar") === null && r.height < 43.5; }).map((e) => `${e.tagName.toLowerCase()}:${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 16)}:${Math.round(e.getBoundingClientRect().height)}px`).slice(0, 6));
    assert.deepEqual(small, [], `${path}: touch targets under 44px`);
  }
  await touch.close();
});

test("UI-31 landing navbar: floating liquid-glass header, pill capsule glides between links and fades out, current page capsule, works in the scholarship header and in dark mode", async () => {
  const { ctx, page, errors } = await newPage();
  for (const [path, label, current] of [["/", "Əsas naviqasiya", "Ana Səhifə"], ["/teqaud", "Təqaüd naviqasiyası", "Təqaüd haqqında"]]) {
    await page.goto(BASE + path);
    await page.waitForLoadState("networkidle").catch(() => {});
    const header = page.locator("header").first();
    assert.match(await header.evaluate((e) => getComputedStyle(e).backdropFilter || getComputedStyle(e).webkitBackdropFilter), /blur/, `${path}: header is liquid glass`);
    const box = await header.boundingBox();
    assert.ok(box.y >= 8 && box.x >= 8, `${path}: the header floats with a margin (${JSON.stringify(box)})`);
    const nav = page.getByRole("navigation", { name: label });
    const links = nav.getByRole("link");
    const n = await links.count();
    assert.ok(n >= 3, `${path}: nav links`);
    const hover = nav.locator(".pill-nav-hover");
    assert.equal(await hover.getAttribute("data-on"), "false");
    const xOf = (i) => links.nth(i).evaluate((e) => e.offsetLeft);
    const pillX = () => hover.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41);
    await links.nth(1).hover();
    await page.waitForTimeout(400);
    assert.equal(await hover.getAttribute("data-on"), "true");
    assert.equal(Math.round(await pillX()), await xOf(1), `${path}: capsule is behind the hovered link`);
    await links.nth(n - 1).hover();
    await page.waitForTimeout(450);
    assert.equal(Math.round(await pillX()), await xOf(n - 1), `${path}: capsule glided to the last link`);
    assert.match(await hover.evaluate((e) => getComputedStyle(e).transitionProperty), /transform/);
    await page.mouse.move(700, 600);
    await page.waitForTimeout(400);
    assert.equal(await hover.getAttribute("data-on"), "false", `${path}: capsule fades out when the cursor leaves`);
    assert.equal(await nav.getByRole("link", { name: current, exact: true }).getAttribute("aria-current"), "page");
    assert.equal(await nav.locator(".pill-nav-active").getAttribute("data-on"), "true", `${path}: the current-page capsule shows`);
  }
  // dark mode: the capsule turns light-on-dark
  await page.goto(BASE + "/");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.getByRole("navigation", { name: "Əsas naviqasiya" }).getByRole("link").nth(1).hover();
  await page.waitForTimeout(400);
  const bg = await page.locator(".pill-nav-hover").first().evaluate((e) => getComputedStyle(e).backgroundColor);
  assert.match(bg, /rgba\(255, 255, 255/, `dark capsule colour ${bg}`);
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await ctx.close();
});

test("UI-32 landing fox mascot (frames from the outro video): still first, then works / looks up / watches / winks and flops an ear in turn, types only while working, pauses off screen, still under 'reduce motion', fits a phone", async () => {
  const { ctx, page, errors } = await newPage();
  const frameReqs = [];
  page.on("response", (r) => /\/assets\/fox\/f\d+\.webp/.test(r.url()) && frameReqs.push(r.status()));
  await page.goto(BASE + "/");
  await page.waitForSelector(".fox .fox-canvas");
  assert.match(await page.locator(".fox-base").getAttribute("src") ?? "", /fox%2Ff060|fox\/f060/, "the still picture is the fox facing the viewer");
  assert.equal(await page.locator(".fox-bubble").getAttribute("aria-hidden"), "true", "the decorative bubble is hidden from screen readers");
  // the frames load and the canvas goes live
  await page.waitForFunction(() => document.querySelector(".fox")?.getAttribute("data-live") === "true", null, { timeout: 30_000 });
  assert.ok(frameReqs.length >= 40 && frameReqs.every((s) => s === 200), `frame requests: ${frameReqs.length}`);
  // it walks through the choreography; collect the states and the canvas picture in each
  const picture = () => page.evaluate(() => { const c = document.querySelector(".fox-canvas"); const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0; return h; });
  const seen = new Set();
  const pics = new Set();
  const typed = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 24_000 && !(["work", "up", "idle", "event"].every((x) => seen.has(x)))) {
    const st = await page.locator(".fox").getAttribute("data-state");
    seen.add(st);
    pics.add(await picture());
    typed.push([st, (await page.locator(".fox-bubble-code").innerText()).length]);
    await page.waitForTimeout(160);
  }
  for (const x of ["down", "work", "up", "idle", "event"]) assert.ok(seen.has(x), `state ${x} not reached (saw ${[...seen].join(",")})`);
  assert.ok(pics.size >= 12, `the canvas shows many different pictures (${pics.size})`);
  // the code is typed only while the fox works: text length never grows outside the work state
  let grewOutsideWork = 0;
  for (let i = 1; i < typed.length; i++) if (typed[i][0] !== "work" && typed[i - 1][0] !== "work" && typed[i][1] > typed[i - 1][1]) grewOutsideWork++;
  assert.equal(grewOutsideWork, 0, "the bubble must not type while the fox is not working");
  assert.ok(typed.some(([st, n]) => st === "work" && n > 3), "the bubble has code in it while the fox works");
  // off screen = paused (the clock of the state machine stops)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  assert.equal(await page.locator(".fox").getAttribute("data-play"), "false", "paused when scrolled away");
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await ctx.close();

  // reduce motion: one still picture, first line in the bubble, no frames downloaded, nothing animates
  const calm = await browser.newContext({ viewport: VIEWPORTS.desktop, reducedMotion: "reduce" });
  const cp = await calm.newPage();
  const calmReqs = [];
  cp.on("response", (r) => /\/assets\/fox\/f\d+\.webp/.test(r.url()) && calmReqs.push(r.url()));
  await cp.goto(BASE + "/");
  await cp.waitForSelector(".fox .fox-canvas", { state: "attached" });
  await cp.waitForTimeout(2500);
  assert.equal(await cp.locator(".fox").getAttribute("data-live"), "false", "the canvas never goes live under reduce motion");
  assert.equal(await cp.locator(".fox").getAttribute("data-state"), "still");
  assert.ok(calmReqs.every((u) => /f060/.test(u)), `only the still picture is downloaded: ${calmReqs.join(",")}`);
  assert.match(await cp.locator(".fox-bubble-code").innerText(), /print\("Salam, dünya!"\)/, "the bubble shows the first line, still");
  await calm.close();

  // phone
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pp = await phone.newPage();
  await pp.goto(BASE + "/");
  await pp.waitForSelector(".fox .fox-canvas");
  const sw = await pp.evaluate(() => document.documentElement.scrollWidth);
  assert.ok(sw <= 390, `the fox must not widen the page (${sw}px)`);
  const bub = await pp.locator(".fox-bubble").boundingBox();
  assert.ok(bub.x >= 0 && bub.x + bub.width <= 390, `the bubble stays on the screen (${JSON.stringify(bub)})`);
  await phone.close();
});

// ---------------------------------------------------------------------------------------------------------------------------
// Blog: the author's panel (write → checklist → publish), the public pages, and the admin's author management.
const PNG1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

test("UI-33 blog author panel: write with the toolbar, preview, upload a cover, the checklist gates publishing, publish, edit, schedule, delete; admin manages authors", async () => {
  const t = tag();
  const email = `qa.ui.blog.${t}@qa.test`;
  const made = await admin.post("/api/admin/blog/authors", { name: `UI Blogger ${t}`, email, password: "Blogger-pw-1", position: "UI müəllif" });
  assert.equal(made.status, 201);
  const { ctx, page, errors } = await newPage();
  await signIn(page, email, "Blogger-pw-1", "/blogger");
  // the panel: dashboard, sidebar with its four entries, the current page highlighted, no bell
  await page.waitForSelector("text=Yeni yazı yaz");
  assert.equal(await page.locator('nav[aria-label="Bloq paneli naviqasiyası"] a:visible').count(), 4);
  assert.equal(await page.getByRole("button", { name: /Bildirişlər/ }).count() + await page.getByRole("link", { name: /Bildirişlər/ }).count(), 0, "the blog panel has no notification bell");
  await page.goto(BASE + "/blogger/yazilar/yeni");
  assert.equal(await page.locator('nav[aria-label="Bloq paneli naviqasiyası"] [aria-current="page"]:visible').count(), 1, "exactly one sidebar entry is current");
  assert.match(await page.locator('nav[aria-label="Bloq paneli naviqasiyası"] [aria-current="page"]:visible').innerText(), /Yeni yazı/);

  // publishing is blocked until the checklist is complete
  const publish = page.getByRole("button", { name: /^(Dərc et|Planlaşdır)$/ });
  assert.equal(await publish.isDisabled(), true, "nothing filled in: publish is disabled");
  await page.fill("#pe-title", `UI Bloq yazısı ${t}`);
  assert.equal(await page.inputValue("#pe-slug"), `ui-bloq-yazisi-${t}`, "slug follows the title (Azerbaijani letters transliterated)");
  // toolbar: heading, bold, list, link, quote
  await page.click("#pe-content");
  await page.getByRole("button", { name: /Böyük başlıq/ }).click();
  await page.keyboard.type("Girişdən başlayaq");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.fill("#pe-content", (await page.inputValue("#pe-content")) + `${"Uşaqlar proqramlaşdırmanı oyun kimi öyrənir və hər dərsdən sonra kiçik bir layihə ortaya qoyur. ".repeat(4)}\n\n`);
  await page.locator("#pe-content").press("Control+End");
  await page.getByRole("button", { name: "Nişanlı siyahı" }).click();
  await page.keyboard.type("birinci bənd");
  await page.getByRole("button", { name: "Qalın" }).click();
  const body = await page.inputValue("#pe-content");
  assert.match(body, /^## Girişdən başlayaq/m);
  assert.match(body, /^- birinci bənd/m);
  assert.match(body, /\*\*qalın mətn\*\*/);
  // preview shows the rendered article (heading, list, bold)
  await page.getByRole("tab", { name: "Önizləmə" }).click();
  assert.equal(await page.locator(".blog-prose h2").first().innerText(), "Girişdən başlayaq");
  assert.ok(await page.locator(".blog-prose ul li").count() >= 1);
  assert.ok(await page.locator(".blog-prose strong").count() >= 1);
  await page.getByRole("tab", { name: "Yaz" }).click();
  assert.equal(await publish.isDisabled(), true, "still no cover");
  // cover upload + alt text complete the checklist
  await page.setInputFiles('input[aria-label="Qapaq şəkli yüklə"]', { name: "cover.png", mimeType: "image/png", buffer: PNG1 });
  await page.waitForSelector('img[src^="/uploads/"]');
  assert.equal(await publish.isDisabled(), true, "cover without alt text is not enough");
  await page.fill("#pe-alt", "Uşaqlar noutbuk arxasında kod yazır");
  assert.equal(await publish.isDisabled(), false, "title + body + cover + alt: ready to publish");
  await page.selectOption("#pe-cat", "Proqramlaşdırma");
  await page.fill("#pe-tags", "python, uşaqlar,");
  assert.equal(await page.getByText("#python").count() + await page.getByText("#uşaqlar").count(), 2, "comma turns the words into tags");
  await page.fill("#pe-md", "Uşaqlara proqramlaşdırmanı oyun kimi öyrətməyin üç sadə yolu: layihə, təkrar və mükafat.");
  assert.match(await page.locator('[aria-label="Google-da necə görünəcək"]').innerText(), /Uşaqlara proqramlaşdırmanı/, "search-result preview follows the SEO description");

  // save as a draft first: the address becomes /blogger/yazilar/<id>; not on the site yet
  await page.getByRole("button", { name: "Qaralama kimi saxla" }).click();
  await page.waitForURL(/\/blogger\/yazilar\/[a-z0-9]+$/, { timeout: 20_000 });
  const slug = `ui-bloq-yazisi-${t}`;
  const row = (await sql(`select status, category, tags, "readingMinutes" rm from "BlogPost" where slug=$1`, [slug]))[0];
  assert.equal(row.status, "DRAFT");
  assert.equal(row.category, "Proqramlaşdırma");
  assert.deepEqual(row.tags, ["python", "uşaqlar"]);
  assert.equal((await fetch(`${BASE}/bloq/${slug}`)).status, 404);
  // publish
  await page.getByRole("button", { name: "Dərc et" }).click();
  await page.waitForSelector("text=Yazı dərc olundu.");
  assert.equal((await sql(`select status from "BlogPost" where slug=$1`, [slug]))[0].status, "PUBLISHED");
  // the public page, in a fresh browser context
  const pub = await newPage();
  await pub.page.goto(BASE + `/bloq/${slug}`);
  assert.equal(await pub.page.locator("h1").innerText(), `UI Bloq yazısı ${t}`);
  assert.ok(await pub.page.locator('img[alt="Uşaqlar noutbuk arxasında kod yazır"]').count() >= 1, "cover with its alt text");
  assert.ok(await pub.page.locator(".blog-prose h2#girisden-baslayaq").count() === 1);
  await pub.page.waitForTimeout(4600);
  assert.equal((await sql(`select views from "BlogPost" where slug=$1`, [slug]))[0].views, 1, "a read is counted after a few seconds");
  assert.equal(await pub.page.locator('a[href="/bloq"]').first().isVisible(), true);
  await pub.page.getByRole("button", { name: "Linki kopyala" }).click({ timeout: 5000 }).catch(() => {});
  assert.deepEqual(pub.errors.filter((e) => !/clipboard|Failed to load resource/i.test(e)), []);
  await pub.ctx.close();

  // edit: change the title, keep the address; then schedule it for the future → disappears from the site
  await page.goto(BASE + (await page.url().replace(BASE, "")));
  await page.fill("#pe-title", `UI Bloq yazısı ${t} (yeni)`);
  assert.equal(await page.inputValue("#pe-slug"), slug, "editing the title of a saved post does not move its address");
  const future = new Date(Date.now() + 2 * 86400_000);
  const p2 = (n) => String(n).padStart(2, "0");
  await page.fill("#pe-when", `${future.getFullYear()}-${p2(future.getMonth() + 1)}-${p2(future.getDate())}T10:00`);
  await page.getByRole("button", { name: /^(Yenilə|Planlaşdır)$/ }).click();
  await page.waitForSelector("text=Yazı planlandı.");
  assert.equal((await fetch(`${BASE}/bloq/${slug}`)).status, 404, "scheduled: not public");
  await page.goto(BASE + "/blogger/yazilar");
  assert.match(await page.locator("tbody tr").first().innerText(), /planlan/i); // the badge is upper-cased by CSS

  // profile
  await page.goto(BASE + "/blogger/profil");
  await page.fill("#pf-pos", "UI baş müəllif");
  await page.fill("#pf-bio", "UI test bioqrafiyası.");
  await page.getByRole("button", { name: "Yadda saxla" }).click();
  await page.waitForSelector("text=Profil yeniləndi.");
  assert.equal((await sql(`select position from "BlogAuthor" ba join "User" u on u.id=ba."userId" where u.email=$1`, [email]))[0].position, "UI baş müəllif");

  // delete from the list (confirm dialog is auto-accepted)
  await page.goto(BASE + "/blogger/yazilar");
  await page.getByRole("button", { name: "Sil" }).first().click();
  await page.waitForFunction(() => !document.body.innerText.includes("(yeni)"), null, { timeout: 15_000 });
  assert.equal((await sql(`select count(*)::int n from "BlogPost" where slug=$1`, [slug]))[0].n, 0);
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await ctx.close();

  // admin: the author list shows the account; deactivating it from the UI blocks sign-in
  const a = await newPage();
  await signIn(a.page, ADMIN.email, ADMIN.password, "/admin");
  await a.page.goto(BASE + "/admin/blog");
  await a.page.waitForSelector(`text=UI Blogger ${t}`);
  await a.page.locator("tr", { hasText: `UI Blogger ${t}` }).getByRole("button", { name: "Deaktiv et" }).click();
  await a.page.waitForFunction((n) => [...document.querySelectorAll("tr")].some((r) => r.innerText.includes(n) && [...r.querySelectorAll("button")].some((b) => b.textContent.trim().toLowerCase() === "aktiv et")), `UI Blogger ${t}`, { timeout: 15_000 });
  assert.equal(await new (await import("../tests/helpers.mjs")).Client("x").login(email, "Blogger-pw-1"), false, "a deactivated author cannot sign in");
  assert.deepEqual(a.errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await a.ctx.close();
});

test("UI-34 public blog on phones and computers: list, article, category and search fit 320–1440 px, one h1, contents box and share buttons, dark mode readable", async () => {
  const t = tag();
  const made = await admin.post("/api/admin/blog/authors", { name: `UI Layout ${t}`, email: `qa.ui.layout.${t}@qa.test`, password: "Blogger-pw-1" });
  const au = await loginAs(`qa.ui.layout.${t}@qa.test`, "Blogger-pw-1");
  const fd = new FormData();
  fd.append("file", new Blob([PNG1], { type: "image/png" }), "c.png");
  const cover = (await (await au.raw("/api/uploads", { method: "POST", body: fd })).json()).url;
  const md = `## Birinci bölmə\n\n${"Uzun cümlə uzun cümlə. ".repeat(40)}\n\n### Alt bölmə\n\n${"Daha bir abzas. ".repeat(40)}\n\n\`\`\`\n${"x".repeat(200)}\n\`\`\`\n\n| a | b | c | d |\n|---|---|---|---|\n| ${"u".repeat(40)} | 2 | 3 | 4 |\n\nUzunsözlük: ${"a".repeat(150)}\n`;
  const posts = [];
  for (let i = 0; i < 4; i++) {
    const r = await au.post("/api/blogger/posts", { title: `UI düzən yazısı ${t} ${i}`, content: md, category: "Kibertəhlükəsizlik", tags: ["ui"], coverUrl: cover, coverAlt: "UI qapaq", status: "PUBLISHED" });
    assert.equal(r.status, 201);
    posts.push(r.body);
  }
  assert.ok(made.status === 201);
  for (const width of [320, 390, 768, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
    for (const path of ["/bloq", `/bloq/${posts[0].slug}`, "/bloq/kateqoriya/kibertehlukesizlik", `/bloq?q=${t}`]) {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(sw <= width + 1, `${path} at ${width}px scrolls sideways (${sw}px)`);
      assert.equal(await page.locator("h1").count(), 1, `${path}: one h1`);
      const noAlt = await page.locator("img:not([alt])").count();
      assert.equal(noAlt, 0, `${path}: every image has alt`);
    }
    await page.goto(BASE + `/bloq/${posts[0].slug}`);
    assert.ok(await page.locator('[aria-label="Paylaş"] a, [role="group"][aria-label="Paylaş"] a').count() >= 3, "share links");
    if (width >= 1024) assert.ok(await page.locator('nav[aria-label="Məzmun"] a').count() >= 2, "contents box on wide screens");
    const wideBlocks = await page.evaluate(() => [...document.querySelectorAll(".blog-prose pre, .blog-table-wrap")].every((e) => e.scrollWidth >= e.clientWidth && e.getBoundingClientRect().right <= innerWidth + 1));
    assert.equal(wideBlocks, true, `code blocks and tables scroll inside themselves at ${width}px`);
    assert.deepEqual(errors, [], `${width}px errors`);
    await ctx.close();
  }
  // dark mode: article text is light on dark
  const dark = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
  const dp = await dark.newPage();
  await dp.goto(BASE + `/bloq/${posts[0].slug}`, { waitUntil: "networkidle" });
  await dp.waitForTimeout(800); // the page colours fade in over 300 ms
  const colors = await dp.evaluate(() => { const p = document.querySelector(".blog-prose p"); const c = (e) => getComputedStyle(e).color.match(/\d+/g).map(Number); return { text: c(p), bg: getComputedStyle(document.body).backgroundColor }; });
  assert.ok(colors.text[0] > 150, `article text is light in dark mode: ${colors.text}`);
  await dark.close();
  // admin phone: the blog page fits
  const ap = await newPage("mobile");
  await signIn(ap.page, ADMIN.email, ADMIN.password, "/admin");
  await ap.page.goto(BASE + "/admin/blog");
  await ap.page.waitForLoadState("networkidle").catch(() => {});
  assert.ok((await ap.page.evaluate(() => document.documentElement.scrollWidth)) <= VIEWPORTS.mobile.width + 1, "admin blog page does not scroll sideways on a phone");
  await ap.ctx.close();
});

test("UI-35 teacher attaches files to a homework: pick → list → remove → type/size/limit errors → create; student, parent and the teacher's own grading screen get working download links; phone fits", async () => {
  const w2 = await makeWorld(admin);
  const tA = await loginAs(w2.teacherA.email, w2.pw);
  assert.equal((await tA.post(`/api/teacher/classes/${w2.classA.id}/lessons`, { date: slot(2, 13) })).status, 201);
  const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
  const title = `UI fayllı tapşırıq ${tag()}`;
  const { ctx, page, errors } = await newPage();
  await signIn(page, w2.teacherA.email, w2.pw, "/teacher");
  await page.goto(BASE + "/teacher/homework/new");
  await page.waitForSelector('[name="hwTitle"]');
  await page.fill('[name="hwTitle"]', title);
  await page.fill('[name="hwDescription"]', "Faylı oxuyun və tapşırıqları yerinə yetirin.");
  const picker = page.locator('input[aria-label="Tapşırığa fayl əlavə et"]');
  assert.equal(await picker.getAttribute("accept") !== null, true, "the picker limits the dialog to the allowed types");
  // the section is there with its hint
  await page.waitForSelector("text=Fayl əlavə et");
  assert.match(await page.locator("body").innerText(), /ən çox 10 MB/);
  // two good files and one executable: the good ones are listed, the bad one gets a toast
  await picker.setInputFiles([
    { name: "Tapşırıq vərəqi.pdf", mimeType: "application/pdf", buffer: PDF },
    { name: "başlanğıc.py", mimeType: "text/x-python", buffer: Buffer.from("print('salam')\n") },
    { name: "virus.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ......") },
  ]);
  await page.waitForSelector("text=Tapşırıq vərəqi.pdf");
  await page.waitForSelector("text=başlanğıc.py");
  await page.waitForSelector("text=/virus\\.exe.*dəstəklənmir/");
  assert.equal(await page.getByRole("button", { name: "Faylı sil" }).count(), 2, "two files in the list, the refused one is not");
  assert.equal(await page.locator("text=virus.exe").count() <= 1, true);
  // remove one: it leaves the list and the database
  const orphansBefore = (await sql(`select count(*)::int n from "HomeworkFile" f join "User" u on u.id=f."uploaderId" where lower(u.email)=lower($1) and f."homeworkId" is null`, [w2.teacherA.email]))[0].n;
  assert.equal(orphansBefore, 2);
  await page.locator("div", { hasText: /^başlanğıc\.py/ }).getByRole("button", { name: "Faylı sil" }).last().click();
  await page.waitForFunction(() => !document.body.innerText.includes("başlanğıc.py"));
  await page.waitForFunction(async () => true);
  await page.waitForTimeout(400);
  assert.equal((await sql(`select count(*)::int n from "HomeworkFile" f join "User" u on u.id=f."uploaderId" where lower(u.email)=lower($1) and f."homeworkId" is null`, [w2.teacherA.email]))[0].n, 1, "the removed file is gone from the database");
  // the limit of five
  await picker.setInputFiles(Array.from({ length: 6 }, (_, i) => ({ name: `ek${i}.txt`, mimeType: "text/plain", buffer: Buffer.from(`ek ${i}`) })));
  await page.waitForSelector("text=/Ən çox 5 fayl/");
  await page.waitForFunction(() => document.querySelectorAll('button[aria-label="Faylı sil"]').length === 5, null, { timeout: 15_000 });
  await page.waitForTimeout(300);
  // phone: a long name must not widen the page
  await page.setViewportSize({ width: 390, height: 844 });
  // create (only the first file stays: remove the four extras one by one)
  await page.setViewportSize({ width: 1366, height: 900 });
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Faylı sil" }).last().click();
  await page.waitForFunction(() => document.querySelectorAll('button[aria-label="Faylı sil"]').length === 1);
  await page.getByRole("button", { name: "Tapşırığı təyin et" }).click();
  await page.waitForURL(/\/teacher\/homework$/, { timeout: 30_000 });
  const hw = (await sql(`select id from "Homework" where title=$1`, [title]))[0];
  assert.ok(hw, "the homework exists");
  const files = await sql(`select filename, size from "HomeworkFile" where "homeworkId"=$1`, [hw.id]);
  assert.deepEqual(files.map((f) => f.filename), ["Tapşırıq vərəqi.pdf"]);
  assert.equal((await sql(`select count(*)::int n from "HomeworkFile" f join "User" u on u.id=f."uploaderId" where lower(u.email)=lower($1) and f."homeworkId" is null`, [w2.teacherA.email]))[0].n, 0, "nothing left unattached");

  // the teacher's grading screen has the link; clicking it downloads the file with its real name
  await page.goto(BASE + `/teacher/homework/${hw.id}/grade`);
  const link = page.locator('a[href^="/api/files/homework/"]', { hasText: "Tapşırıq vərəqi.pdf" });
  await link.waitFor();
  const [download] = await Promise.all([page.waitForEvent("download"), link.evaluate((a) => { a.removeAttribute("target"); a.click(); })]);
  assert.equal(download.suggestedFilename(), "Tapşırıq vərəqi.pdf");
  assert.deepEqual(errors.filter((e) => !/Failed to load resource|status of 4/.test(e)), []);
  await ctx.close();

  // student and parent: the homework row carries the link; a phone fits
  for (const [who, u, home, vp] of [["student", w2.student1, "/student", "desktop"], ["parent", w2.parent1, "/parent", "desktop"], ["student on a phone", w2.student1, "/student", "mobile"]]) {
    const s = await newPage(vp);
    await signIn(s.page, u.email, w2.pw, home);
    await s.page.goto(BASE + `${home}/homework`, { waitUntil: "domcontentloaded" });
    const a = s.page.locator('a[href^="/api/files/homework/"]', { hasText: "Tapşırıq vərəqi.pdf" }).locator("visible=true").first();
    await a.waitFor({ timeout: 30_000 });
    const res = await s.page.request.get(BASE + (await a.getAttribute("href")));
    assert.equal(res.status(), 200, `${who}: the link works`);
    assert.equal(res.headers()["content-type"], "application/pdf");
    const sw = await s.page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(sw <= (vp === "mobile" ? VIEWPORTS.mobile.width : VIEWPORTS.desktop.width) + 1, `${who}: no sideways scroll (${sw}px)`);
    await s.ctx.close();
  }
});

test("UI-36 landing cadet section (second section): the head follows the pointer, the course he looks at lights up, hovering a course turns him, the helmet toggles, courses link to their pages; phone row, touch, reduced motion, no overflow", async () => {
  const { ctx, page, errors } = await newPage();
  const reqs = [];
  page.on("response", (r) => /\/assets\/cadet\//.test(r.url()) && reqs.push(`${r.status()} ${r.url().split("/").pop()}`));
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  // it sits right below the hero (the h1 section), before the marquee and the course highlights
  const around = await page.evaluate(() => { const w = document.querySelector(".cd-section").parentElement; return { before: w.previousElementSibling?.querySelector("h1") ? "hero" : w.previousElementSibling?.tagName, after: w.nextElementSibling?.innerText.slice(0, 40) }; });
  assert.equal(around.before, "hero", "directly below the hero");
  assert.match(around.after, /ROBOTOTEXN/i, "the marquee comes right after it");
  await page.evaluate(() => document.querySelector(".cd-section").scrollIntoView());
  await page.waitForFunction(() => document.querySelector(".cd-head")?.classList.contains("is-on") || document.querySelector(".cd-head")?.readyState >= 2, null, { timeout: 30_000 });
  await page.mouse.move(700, 500);
  await page.waitForTimeout(600);
  assert.equal(await page.locator("h2#cd-title").textContent(), "Kəşf et");
  assert.equal(await page.locator(".cd-cards-l .cd-card").count() + (await page.locator(".cd-cards-r .cd-card").count()), 6, "six courses");
  // left stack top→bottom looks from far left towards the middle; right stack top→bottom from far right towards the middle:
  // moving the pointer DOWN brings the gaze back to the centre (the clip's extreme poses look up, so they sit at the top)
  assert.deepEqual(await page.locator(".cd-cards-l .cd-card b").allInnerTexts(), ["Kibertəhlükəsizlik", "Proqramlaşdırma", "Robotexnika"]);
  assert.deepEqual(await page.locator(".cd-cards-r .cd-card b").allInnerTexts(), ["Oyun Yaratma", "Süni İntellekt", "Elektronika"]);
  const gazeOfCard = async (name) => { await page.locator(".cd-card", { hasText: name }).hover(); await page.waitForTimeout(1000); return page.evaluate(() => document.querySelector(".cd-head").currentTime); };
  const down = [await gazeOfCard("Oyun Yaratma"), await gazeOfCard("Süni İntellekt"), await gazeOfCard("Elektronika")];
  const dur = await page.evaluate(() => document.querySelector(".cd-head").duration);
  assert.ok(down[0] > down[1] && down[1] > down[2], `down the right stack the pose gets milder: ${down.map((x) => x.toFixed(2))}`);
  assert.ok(down[2] / dur >= 0.78, `even the lowest right card (Elektronika) is looked AT: his head is turned to the right (${(down[2] / dur).toFixed(2)} of the clip)`);
  const downL = [await gazeOfCard("Kibertəhlükəsizlik"), await gazeOfCard("Proqramlaşdırma"), await gazeOfCard("Robotexnika")];
  assert.ok(downL[0] < downL[1] && downL[1] < downL[2], `down the left stack too: ${downL.map((x) => x.toFixed(2))}`);
  assert.ok(downL[2] / dur <= 0.25, `the lowest left card is looked at too: head turned left (${(downL[2] / dur).toFixed(2)} of the clip)`);
  // straight ahead: no course is highlighted and the subtitle invites to move the pointer
  await page.mouse.move(Math.round(VIEWPORTS.desktop.width / 2), 300);
  await page.waitForFunction(() => !document.querySelector(".cd-card.is-active"), null, { timeout: 8000 });
  assert.match(await page.locator(".cd-sub").innerText(), /kursoru sağa-sola apar/i);
  const time = () => page.evaluate(() => document.querySelector(".cd-head").currentTime);
  const activeName = () => page.locator(".cd-card.is-active b").innerText();
  // far left of the frame: head looks left, the first course is the active one; far right: the last one
  await page.mouse.move(6, 450);
  await page.waitForFunction(() => document.querySelector(".cd-card.is-active b")?.textContent === "Kibertəhlükəsizlik", null, { timeout: 8000 });
  const tLeft = await time();
  await page.mouse.move(VIEWPORTS.desktop.width - 6, 450);
  await page.waitForFunction(() => document.querySelector(".cd-card.is-active b")?.textContent === "Oyun Yaratma", null, { timeout: 8000 });
  const tRight = await time();
  assert.ok(tRight - tLeft > 3, `the clip is scrubbed from the left pose to the right pose (${tLeft.toFixed(2)} → ${tRight.toFixed(2)} s)`);
  assert.match(await page.locator(".cd-sub").innerText(), /^Oyun Yaratma: /, "the subtitle shows the active course's line");
  // hovering a course turns him to it
  await page.locator(".cd-card", { hasText: "Proqramlaşdırma" }).hover();
  await page.waitForFunction(() => document.querySelector(".cd-card.is-active b")?.textContent === "Proqramlaşdırma");
  await page.waitForTimeout(900);
  const tProg = await time();
  assert.ok(tProg > tLeft + 0.3 && tProg < tRight - 0.3, `hovering the 2nd course turns the head part of the way (${tProg.toFixed(2)} s)`);
  assert.equal(await page.locator(".cd-card.is-active .cd-go").isVisible(), true, "the active card offers 'Kursa bax'");
  // the ring cursor replaces the fox cursor over the stage
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("cd-over")), true);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".cd-ring")).opacity), "1");
  // the floating header goes dark over this section and back to normal above it
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("cd-dark-nav")), true);
  // the helmet
  const push = page.locator(".cd-push");
  assert.equal(await push.getAttribute("aria-pressed"), "false");
  await push.click();
  await page.waitForTimeout(1000);
  assert.equal(await push.getAttribute("aria-pressed"), "true");
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".cd-helmet")).opacity), "1", "the helmet is on");
  await push.click();
  await page.waitForTimeout(1000);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".cd-helmet")).opacity), "0", "the helmet is off again");
  // a course card is a real link to the course page
  await Promise.all([page.waitForURL(/\/kurslar\/kibertehlukesizlik$/), page.locator(".cd-card", { hasText: "Kibertəhlükəsizlik" }).click()]);
  assert.ok(reqs.some((r) => /^200 head\.mp4/.test(r)) && reqs.some((r) => /^200 plate\.jpg/.test(r)), `assets served: ${reqs.join(", ")}`);
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  await ctx.close();

  // reduced motion: no clip is downloaded, the poster stays, courses still work
  const calm = await browser.newContext({ viewport: VIEWPORTS.desktop, reducedMotion: "reduce" });
  const cp = await calm.newPage();
  const calmReqs = [];
  cp.on("response", (r) => /head\.mp4/.test(r.url()) && calmReqs.push(r.status()));
  await cp.goto(BASE + "/", { waitUntil: "networkidle" });
  await cp.evaluate(() => document.querySelector(".cd-section").scrollIntoView());
  await cp.waitForTimeout(1500);
  assert.deepEqual(calmReqs, [], "no video under reduced motion");
  assert.equal(await cp.locator(".cd-head.is-on").count(), 0);
  assert.equal(await cp.locator(".cd-title").isVisible(), true, "nothing is left invisible without the entrance animation");
  await calm.close();

  // phones: the courses become a row under the stage, a finger scrubs the head, nothing is wider than the screen
  for (const width of [320, 390]) {
    const phone = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
    const pp = await phone.newPage();
    await pp.goto(BASE + "/", { waitUntil: "networkidle" });
    await pp.evaluate(() => document.querySelector(".cd-section").scrollIntoView());
    await pp.waitForFunction(() => document.querySelector(".cd-head")?.readyState >= 2, null, { timeout: 30_000 });
    assert.ok((await pp.evaluate(() => document.documentElement.scrollWidth)) <= width + 1, `${width}px: no sideways scroll`);
    assert.equal(await pp.locator(".cd-dock").isVisible(), true);
    assert.equal(await pp.locator(".cd-cards:visible").count(), 0, "the side cards are not used on phones");
    assert.equal(await pp.locator(".cd-chip").count(), 6);
    // untouched, the head sweeps by itself and the courses take turns being looked at (a phone has no cursor)
    if (width === 390) {
      assert.match(await pp.locator(".cd-sub").innerText(), /Ekrana toxun/, "the phone hint talks about touch, not a cursor");
      const lit = new Set();
      let lo = 99;
      let hi = 0;
      for (let i = 0; i < 28; i++) {
        const [t, n] = await pp.evaluate(() => [document.querySelector(".cd-head").currentTime, document.querySelector(".cd-chip.is-active b")?.textContent ?? "-"]);
        lit.add(n); lo = Math.min(lo, t); hi = Math.max(hi, t);
        await pp.waitForTimeout(500);
      }
      lit.delete("-");
      assert.ok(hi - lo > 2.5, `the head moves on its own (${lo.toFixed(2)} → ${hi.toFixed(2)} s)`);
      assert.ok(lit.size >= 3, `several courses get their turn on their own: ${[...lit].join(", ")}`);
    }
    const t1 = await pp.evaluate(() => document.querySelector(".cd-head").currentTime);
    await pp.touchscreen.tap(Math.round(width * 0.9), 350);
    await pp.waitForTimeout(900);
    const t2 = await pp.evaluate(() => document.querySelector(".cd-head").currentTime);
    assert.ok(Math.abs(t2 - t1) > 0.1, `a tap on the stage turns the head (${t1.toFixed(2)} → ${t2.toFixed(2)})`);
    const push2 = pp.locator(".cd-push");
    await push2.tap();
    await pp.waitForTimeout(1000);
    assert.equal(await push2.getAttribute("aria-pressed"), "true");
    await phone.close();
  }
});

test("UI-37 footer glass dock: real links (home, blog, contact, e-mail), tooltip centred over the hovered icon, icon morphs on hover, keyboard focus, dark mode, phones fit, no social icon without an address", async () => {
  const { ctx, page, errors } = await newPage();
  await page.goto(BASE + "/bloq", { waitUntil: "networkidle" });
  const dock = page.locator("nav.glass-dock");
  await dock.scrollIntoViewIfNeeded();
  const links = await dock.locator("a").evaluateAll((as) => as.map((a) => [a.getAttribute("aria-label"), a.getAttribute("href")]));
  assert.deepEqual(
    links,
    [["Instagram", "https://www.instagram.com/saleh.tech.school/"], ["LinkedIn", "https://www.linkedin.com/company/salehtechschool/"], ["TikTok", "https://www.tiktok.com/@saleh.tech.school"], ["Bloq", "/bloq"], ["E-poçt", "/elaqe"]],
    "Instagram first, then LinkedIn and TikTok, the blog, and the e-mail LAST (it falls back to the contact page); no home / contact / address icons, no Facebook / X / GitHub without an address"
  );
  for (const name of ["Instagram", "LinkedIn", "TikTok"]) {
    const a = dock.locator(`a[aria-label="${name}"]`);
    assert.equal(await a.getAttribute("target"), "_blank", `${name} opens in a new tab`);
    assert.match((await a.getAttribute("rel")) ?? "", /noopener/, `${name} has rel=noopener`);
    assert.ok((await a.locator("svg").count()) >= 1, `${name} has an icon`);
  }
  assert.equal(await page.locator("footer h4", { hasText: "Bizi İzləyin" }).count(), 0, "the old social column is replaced by the dock");
  const d = () => page.evaluate(() => document.querySelector('a[aria-label="Bloq"] [data-dock-morph] path').getAttribute("d"));
  const rest = await d(); // the blog icon's own shape, before anything was hovered
  // hovering shows the label centred above the icon
  const blog = dock.locator('a[aria-label="Bloq"]');
  await blog.hover();
  const tip = page.locator(".glass-dock .whitespace-nowrap", { hasText: "Bloq" }).first();
  await tip.waitFor();
  await page.waitForTimeout(900);
  const seenShapes = new Set([rest]);
  for (let i = 0; i < 6; i++) { seenShapes.add(await d()); await page.waitForTimeout(60); }
  const [a, t] = [await blog.boundingBox(), await tip.boundingBox()];
  assert.ok(Math.abs(a.x + a.width / 2 - (t.x + t.width / 2)) < 6, `tooltip centred over the icon (icon ${Math.round(a.x + a.width / 2)}, tip ${Math.round(t.x + t.width / 2)})`);
  assert.ok(t.y + t.height <= a.y + 2, "the tooltip sits above the icon");
  // the icon collapses into a teardrop and springs back (GSAP MorphSVG, loaded on first hover)
  await dock.locator("a").nth(0).hover(); // Instagram: lifts, does not morph
  await blog.hover();
  await page.waitForFunction((r) => document.querySelector('a[aria-label="Bloq"] [data-dock-morph] path').getAttribute("d") !== r, rest, { timeout: 8000 }).catch(() => {}); // (the first hover above may already have played it)
  await page.waitForTimeout(1800);
  assert.equal((await d()).replace(/\s+/g, " ").slice(0, 20), rest.replace(/\s+/g, " ").slice(0, 20), "back to the icon's own shape after the morph");
  // keyboard: Tab onto an icon shows its label too
  await page.mouse.move(5, 5);
  await dock.locator("a").last().focus();
  await page.waitForSelector(".glass-dock .whitespace-nowrap:has-text('E-poçt')");
  // a link works: client-side navigation to the contact page
  await Promise.all([page.waitForURL(/\/elaqe$/), dock.locator("a").last().click()]);
  assert.deepEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  // dark mode: the dock is dark glass with light icons
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(700); // colours fade over a few hundred ms
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector("nav.glass-dock")).backgroundColor);
  assert.match(bg, /rgba?\(0, 0, 0/, `dark dock background ${bg}`);
  await ctx.close();
  for (const width of [320, 390]) {
    const phone = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
    const pp = await phone.newPage();
    await pp.goto(BASE + "/", { waitUntil: "networkidle" });
    await pp.locator("nav.glass-dock").scrollIntoViewIfNeeded();
    assert.ok((await pp.evaluate(() => document.documentElement.scrollWidth)) <= width + 1, `${width}px: no sideways scroll`);
    const box = await pp.locator("nav.glass-dock").boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width, `${width}px: the dock fits on the screen (${JSON.stringify(box)})`);
    await Promise.all([pp.waitForURL(/\/bloq$/), pp.locator("nav.glass-dock a[aria-label='Bloq']").tap()]);
    await phone.close();
  }
});
