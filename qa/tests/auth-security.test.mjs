// Authentication, session, password-reset, CSRF, headers and upload hardening — against the QA app.
//   qa/run.sh   (or: node --test qa/tests/auth-security.test.mjs)
import test, { before } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { BASE, Client, ADMIN, loginAs, makeWorld, sql, callAction, actionId, tag } from "./helpers.mjs";

const AUTH_PAGES = { pageDir: "(auth)/sifre-unutdum", route: "/sifre-unutdum" };
const RESET_PAGES = (token) => ({ pageDir: "(auth)/sifre-yenile/[token]", route: `/sifre-yenile/${token}` });

let admin, w;
before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
});

// ------------------------------------------------------------------------------------------------ sign-in
test("AUTH-01 valid credentials sign in and the session carries the right role", async () => {
  const t = await loginAs(w.teacherA.email, w.pw);
  assert.equal(t.user.role, "TEACHER");
  const p = await loginAs(w.parent1.email, w.pw);
  assert.equal(p.user.role, "PARENT");
});

test("AUTH-02 wrong password and unknown e-mail are both rejected with no session", async () => {
  for (const [email, pw] of [[w.teacherA.email, "wrong-password"], ["nobody@qa.test", w.pw]]) {
    const c = new Client();
    assert.equal(await c.login(email, pw), false);
    assert.equal(c.jar.has("next-auth.session-token"), false);
  }
});

test("AUTH-03 the session cookie is HttpOnly and SameSite=Lax", async () => {
  const c = new Client();
  await c.login(w.teacherA.email, w.pw);
  const sc = (c.lastSetCookie ?? []).find((s) => s.startsWith("next-auth.session-token="));
  assert.ok(sc, "no session cookie");
  assert.match(sc, /HttpOnly/i);
  assert.match(sc, /SameSite=Lax/i);
});

test("AUTH-04 anonymous visitors are sent to /giris from every panel", async () => {
  const c = new Client();
  for (const p of ["/admin", "/admin/students", "/teacher", "/student", "/parent", "/parent/children"]) {
    const r = await c.raw(p);
    assert.ok([302, 307].includes(r.status), `${p} -> ${r.status}`);
    assert.match(r.headers.get("location") ?? "", /\/giris/);
  }
});

test("AUTH-05 a signed-in user of another role is sent away from a panel", async () => {
  const t = await loginAs(w.teacherA.email, w.pw);
  for (const p of ["/admin", "/student", "/parent"]) {
    const r = await t.raw(p);
    assert.ok([302, 307].includes(r.status), `${p} -> ${r.status}`);
  }
});

// ------------------------------------------------------------------------------------------------ deactivation
async function deactivationCase(role) {
  const t = tag();
  const must = (r) => { assert.ok(r.status < 300, JSON.stringify(r.body)); return r.body; };
  let email, id, path, panel;
  if (role === "TEACHER") {
    const x = must(await admin.post("/api/admin/teachers", { name: `QA Gone Teacher ${t}`, email: `qa.gone.t.${t}@qa.test`, password: "Passw0rd!x", position: "QA" }));
    ({ id } = x); email = `qa.gone.t.${t}@qa.test`; path = `/api/admin/teachers/${id}`; panel = "/teacher";
  } else if (role === "PARENT") {
    const x = must(await admin.post("/api/admin/parents", { name: `QA Gone Parent ${t}`, email: `qa.gone.p.${t}@qa.test`, password: "Passw0rd!x" }));
    ({ id } = x); email = `qa.gone.p.${t}@qa.test`; path = `/api/admin/parents/${id}`; panel = "/parent";
  } else {
    const x = must(await admin.post("/api/admin/students", { firstName: "Gone", lastName: `Student${t}`, email: `qa.gone.s.${t}@qa.test`, password: "Passw0rd!x", birthDate: "2014-01-01", parentId: w.parent1.id }));
    ({ id } = x); email = `qa.gone.s.${t}@qa.test`; path = `/api/admin/students/${id}`; panel = "/student";
  }
  const c = await loginAs(email, "Passw0rd!x");
  assert.equal((await c.raw(panel)).status, 200, "the active user reaches the panel");
  must(await admin.patch(path, { active: false }));
  return { c, email, panel };
}

for (const role of ["TEACHER", "PARENT", "STUDENT"]) {
  test(`AUTH-06 a deactivated ${role} cannot sign in again`, async () => {
    const { email } = await deactivationCase(role);
    assert.equal(await new Client().login(email, "Passw0rd!x"), false);
  });
  test(`AUTH-07 a deactivated ${role}'s existing session stops working at once`, async () => {
    const { c, panel } = await deactivationCase(role);
    const r = await c.raw(panel);
    assert.ok([302, 307].includes(r.status), `${panel} still served ${r.status} to a deactivated ${role}`);
  });
}

test("AUTH-08 a deactivated administrator's existing session stops working (pages and API)", async () => {
  const t = tag();
  const email = `qa.gone.a.${t}@qa.test`;
  const hash = await bcrypt.hash("Passw0rd!x", 10);
  await sql(`insert into "User" (id,name,email,"passwordHash",role,"updatedAt") values ($1,$2,$3,$4,'ADMIN',now())`, [`qa_admin_${t}`, `QA Gone Admin ${t}`, email, hash]);
  const c = await loginAs(email, "Passw0rd!x");
  assert.equal((await c.raw("/admin")).status, 200);
  await sql(`update "User" set active=false where email=$1`, [email]);
  assert.ok([401, 403].includes((await c.get("/api/admin/students")).status), "API refuses the deactivated admin");
  const page = await c.raw("/admin/students");
  assert.ok([302, 307].includes(page.status), `/admin/students still served ${page.status} to a deactivated admin`);
  const html = page.status === 200 ? await page.text() : "";
  assert.ok(!html.includes("QA Teacher"), "deactivated admin must not read data");
});

// ------------------------------------------------------------------------------------------------ brute force
test("AUTH-09 repeated failed sign-ins are throttled (and a different visitor is not locked out)", async () => {
  const email = w.teacherB.email;
  const ip = "203.0.113.9";
  for (let i = 0; i < 8; i++) assert.equal(await new Client("guesser", ip).login(email, `wrong-${i}`), false);
  assert.equal(await new Client("guesser", ip).login(email, w.pw), false, "8 wrong guesses in a row did not trigger any lockout: the correct password was still accepted");
  assert.equal(await new Client("owner", "198.51.100.7").login(email, w.pw), true, "the real owner on another address must not be locked out by a stranger's guesses");
});

// ------------------------------------------------------------------------------------------------ password reset
test("AUTH-10 password reset never returns the reset link to the requester", async () => {
  const c = new Client();
  const r = await callAction(c, AUTH_PAGES, "requestPasswordReset", [{ email: w.parent2.email }]);
  assert.equal(r.status, 200);
  assert.ok(!/sifre-yenile\/[0-9a-f]{20,}/.test(r.text), "the response contains a working reset link → anyone can take over any account knowing only the e-mail");
  assert.ok(!(r.value?.resetLink), "resetLink present in the action result");
});

test("AUTH-11 password reset answers identically for known and unknown e-mails", async () => {
  const c = new Client();
  const known = await callAction(c, AUTH_PAGES, "requestPasswordReset", [{ email: w.parent2.email }]);
  const unknown = await callAction(c, AUTH_PAGES, "requestPasswordReset", [{ email: `nobody.${tag()}@qa.test` }]);
  assert.deepEqual(known.value, unknown.value, "the result differs → account enumeration");
});

test("AUTH-12 a reset token is single-use, expires, and cannot reset a deactivated account", async () => {
  // issue tokens directly the way the application stores them, then redeem them through the real action
  const mk = async (email, ageMs = 60_000, used = false) => {
    const token = [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");
    await sql(`insert into "PasswordResetToken" (id,email,token,"expiresAt","usedAt") values ($1,$2,$3,$4,$5)`, [`qa_t_${tag()}${tag()}`, email, token, new Date(Date.now() + 1800_000 - ageMs).toISOString(), used ? new Date().toISOString() : null]);
    return token;
  };
  const anon = new Client();
  const email = w.parent2.email;
  const tok = await mk(email);
  const ok1 = await callAction(anon, RESET_PAGES(tok), "resetPassword", [{ token: tok, password: "NewPassw0rd!1" }]);
  assert.equal(ok1.value?.status, "success");
  const again = await callAction(anon, RESET_PAGES(tok), "resetPassword", [{ token: tok, password: "NewPassw0rd!2" }]);
  assert.equal(again.value?.status, "error", "token reuse must fail");
  const expired = await mk(email, 3_600_000);
  assert.equal((await callAction(anon, RESET_PAGES(expired), "resetPassword", [{ token: expired, password: "NewPassw0rd!3" }])).value?.status, "error", "expired token must fail");
  assert.equal(await new Client().login(email, "NewPassw0rd!1"), true, "new password works");
  assert.equal(await new Client().login(email, w.pw), false, "old password no longer works");
  await sql(`update "User" set "passwordHash"=$1 where email=$2`, [await bcrypt.hash(w.pw, 10), email]); // restore for later suites

  const gone = await deactivationCase("PARENT");
  const t2 = await mk(gone.email);
  const r = await callAction(anon, RESET_PAGES(t2), "resetPassword", [{ token: t2, password: "NewPassw0rd!4" }]);
  assert.equal(r.value?.status, "error", "a deactivated account must not be re-opened through password reset");
});

test("AUTH-13 password policy is the same on every path (>= 8 characters)", async () => {
  const anon = new Client();
  const email = w.parent1.email;
  const token = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  await sql(`insert into "PasswordResetToken" (id,email,token,"expiresAt") values ($1,$2,$3,$4)`, [`qa_t_${tag()}${tag()}`, email, token, new Date(Date.now() + 600_000).toISOString()]);
  const r = await callAction(anon, RESET_PAGES(token), "resetPassword", [{ token, password: "short1" }]);
  assert.equal(r.value?.status, "error", "a 6-character password was accepted by reset (admin-created accounts require 8)");
});

// ------------------------------------------------------------------------------------------------ public registration
test("AUTH-14 public self-registration of parent accounts is closed", async () => {
  const anon = new Client();
  const r = await anon.raw("/qeydiyyat");
  assert.ok([301, 302, 307, 308].includes(r.status), `/qeydiyyat is still a live sign-up form (${r.status})`);
  assert.match(r.headers.get("location") ?? "", /sinaq-dersi/);
  const email = `qa.selfreg.${tag()}@qa.test`;
  // the sign-up server action is gone together with the page
  assert.throws(() => actionId("(auth)/qeydiyyat", "registerParent"));
  const rows = await sql(`select id from "User" where email=$1`, [email]);
  assert.equal(rows.length, 0);
});

// ------------------------------------------------------------------------------------------------ CSRF
test("SEC-01 cross-site mutating requests to the admin API are refused", async () => {
  const bad = await admin.post("/api/admin/parents", { name: "CSRF Test", email: `csrf.${tag()}@qa.test`, password: "Passw0rd!x" }, { origin: "https://evil.example" });
  assert.equal(bad.status, 403);
  const good = await admin.post("/api/admin/parents", { name: "Same Origin", email: `csrf.ok.${tag()}@qa.test`, password: "Passw0rd!x" }, { origin: BASE });
  assert.equal(good.status, 201);
});

// ------------------------------------------------------------------------------------------------ headers
test("SEC-02 baseline security headers are sent", async () => {
  const r = await new Client().raw("/giris");
  const h = (n) => r.headers.get(n);
  assert.equal(h("x-content-type-options"), "nosniff");
  assert.ok(h("x-frame-options") || /frame-ancestors/.test(h("content-security-policy") ?? ""), "clickjacking protection missing");
  assert.ok(h("referrer-policy"), "Referrer-Policy missing");
  assert.ok(h("permissions-policy"), "Permissions-Policy missing");
  assert.ok(!h("x-powered-by"), "x-powered-by discloses the framework");
});

// ------------------------------------------------------------------------------------------------ uploads
test("SEC-03 uploads require a session", async () => {
  const fd = new FormData();
  fd.append("file", new Blob([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10])], { type: "image/png" }), "a.png");
  const r = await new Client().raw("/api/uploads", { method: "POST", body: fd });
  assert.equal(r.status, 401);
});

test("SEC-04 uploads are verified by content, not by the client-declared type", async () => {
  const c = await loginAs(w.student1.email, w.pw);
  const fd = new FormData();
  fd.append("file", new Blob(["<html><script>alert(1)</script></html>"], { type: "image/png" }), "evil.png");
  const r = await c.raw("/api/uploads", { method: "POST", body: fd });
  assert.equal(r.status, 415, `HTML bytes labelled image/png were stored (status ${r.status})`);
});

test("SEC-05 a real PNG upload still works and is stored under an unguessable name", async () => {
  const c = await loginAs(w.student1.email, w.pw);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  const fd = new FormData();
  fd.append("file", new Blob([png], { type: "image/png" }), "ok.png");
  const r = await c.raw("/api/uploads", { method: "POST", body: fd });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.match(j.url, /^\/uploads\/[0-9a-f-]{36}\.png$/);
});

// ------------------------------------------------------------------------------------------------ operations
test("OPS-01 the health endpoint is public, fast, and discloses nothing", async () => {
  const t0 = Date.now();
  const r = await new Client().raw("/api/health");
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.deepEqual(j, { status: "ok" });
  assert.ok(Date.now() - t0 < 1500, "slow health check");
  assert.equal(r.headers.get("cache-control"), "no-store");
});
