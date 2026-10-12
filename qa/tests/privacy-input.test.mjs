// Privacy and hostile-input regressions: profile pictures, the school-wide leaderboard, stored markup, redirects.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { BASE, Client, ADMIN, loginAs, makeWorld, sql, callAction, slot, tag, TEACHER_ACTIONS, STUDENT_ACTIONS, PARENT_ACTIONS } from "./helpers.mjs";

let admin, w, tA, s1, s2, p1;
before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password);
  w = await makeWorld(admin);
  [tA, s1, s2, p1] = await Promise.all([w.teacherA, w.student1, w.student2, w.parent1].map((u) => loginAs(u.email, w.pw)));
});
const UPLOAD = "/uploads/123e4567-e89b-42d3-a456-426614174000.png";

test("PRIV-01 profile pictures can only point at the application's own uploads (student, teacher, parent)", async () => {
  const bad = ["https://evil.example/pixel.png", "http://127.0.0.1/x.png", "javascript:alert(1)", "//evil.example/a.png", "/uploads/../../etc/passwd", "/uploads/x.png", "x".repeat(5000), ""];
  for (const url of bad) {
    assert.equal((await callAction(s1, STUDENT_ACTIONS, "updateStudentAvatar", [url])).value?.ok, false, `student accepted ${url.slice(0, 40)}`);
    assert.equal((await callAction(tA, TEACHER_ACTIONS, "updateTeacherAvatar", [url])).value?.ok, false, `teacher accepted ${url.slice(0, 40)}`);
    await callAction(p1, PARENT_ACTIONS, "updateAvatar", [url]);
  }
  const rows = await sql(`select (select "avatarUrl" from "StudentProfile" where id=$1) s, (select "photoUrl" from "TeacherProfile" where id=$2) t, (select "avatarUrl" from "User" where email=$3) p`, [w.student1.id, w.teacherA.id, w.parent1.email.toLowerCase()]);
  assert.deepEqual([rows[0].s, rows[0].t, rows[0].p], [null, null, null], "nothing was stored");
  assert.equal((await callAction(s1, STUDENT_ACTIONS, "updateStudentAvatar", [UPLOAD])).value?.ok, true, "a real upload URL is accepted");
  assert.equal((await sql(`select "avatarUrl" a from "StudentProfile" where id=$1`, [w.student1.id]))[0].a, UPLOAD);
});

test("PRIV-02 the leaderboard does not show deactivated students and stays small", async () => {
  const t = tag();
  const gone = await admin.post("/api/admin/students", { firstName: "Ghost", lastName: `Rank${t}`, email: `qa.ghost.${t}@qa.test`, password: "Passw0rd!x", birthDate: "2014-01-01", parentId: w.parent1.id });
  await sql(`update "StudentProfile" set points = 999999 where id=$1`, [gone.body.id]);
  assert.ok((await s2.page("/student/leaderboard")).html.includes(`Ghost Rank${t}`), "an active top scorer is ranked");
  await admin.patch(`/api/admin/students/${gone.body.id}`, { active: false });
  assert.ok(!(await s2.page("/student/leaderboard")).html.includes(`Ghost Rank${t}`), "a deactivated student is still on other children's leaderboard");
});

test("PRIV-03 free text written by one role is escaped when another role reads it", async () => {
  const payload = `<img src=x onerror=alert(1)>QA${tag()}`;
  const les = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(2, 17) });
  assert.equal(les.status, 201);
  const hw = await callAction(tA, TEACHER_ACTIONS, "createHomework", [{ classId: w.classA.id, title: payload, description: `<script>alert(1)</script>${payload}`, dueDate: slot(-3).slice(0, 10) }]);
  assert.equal(hw.value?.ok, true);
  await callAction(tA, TEACHER_ACTIONS, "createStudentNote", [{ studentId: w.student1.id, body: `<svg onload=alert(1)>${payload}`, visibility: "PARENT" }]);
  for (const [who, c, pages] of [["student", s1, ["/student", "/student/homework"]], ["parent", p1, ["/parent", "/parent/homework", "/parent/notifications"]], ["teacher", tA, ["/teacher", "/teacher/homework"]], ["admin", admin, ["/admin/audit", "/admin/notifications"]]]) {
    for (const p of pages) {
      const html = (await c.page(p)).html;
      assert.ok(!/<img src=x onerror|<svg onload|<script>alert\(1\)/.test(html), `${who} ${p}: raw markup reached the page`);
    }
  }
});

test("PRIV-04 sign-in never redirects to another site (open redirect)", async () => {
  const c = new Client();
  const csrf = await (await c.raw("/api/auth/csrf")).json();
  for (const cb of ["https://evil.example/phish", "//evil.example", "javascript:alert(1)"]) {
    const res = await c.raw("/api/auth/callback/credentials", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken: csrf.csrfToken, email: w.teacherA.email, password: w.pw, callbackUrl: cb, json: "true" }) });
    const j = await res.json().catch(() => ({}));
    const target = j.url ?? res.headers.get("location") ?? "";
    assert.equal(new URL(target, BASE).origin, BASE, `callbackUrl ${cb} -> ${target}`); // "//evil.example" resolves to a path on OUR origin, not to the other site
  }
});

test("PRIV-05 error pages do not disclose internals", async () => {
  const c = new Client();
  for (const p of ["/no-such-page", "/kurslar/no-such-course", "/muellimler/no-such-id", "/sifre-yenile/not-a-token"]) {
    const r = await c.page(p);
    assert.ok(r.status === 404 || r.status === 200, `${p} -> ${r.status}`);
    assert.ok(!/at .*\.(js|ts):\d+|node_modules|PrismaClient|prisma\.|ECONNREFUSED|DATABASE_URL/.test(r.html), `${p} leaks internals`);
  }
  const bad = await admin.json("/api/admin/classes", "POST", { name: "x" });
  assert.ok(bad.status === 400 && !/prisma|stack|at /i.test(JSON.stringify(bad.body)), JSON.stringify(bad.body));
  const dbErr = await admin.get("/api/admin/payments?q=%00");
  assert.ok(dbErr.status < 500 || !/prisma|ECONN|column/i.test(JSON.stringify(dbErr.body)), JSON.stringify(dbErr.body));
});

test("PRIV-06 the public landing site shows nothing from the admin-managed tables", async () => {
  const name = `QA Landing ${tag()}`;
  await admin.post("/api/admin/teachers", { name, email: `qa.landing.${tag()}@qa.test`, password: "Passw0rd!x", position: "QA" });
  for (const p of ["/", "/muellimler", "/kurslar"]) assert.ok(!(await new Client().page(p)).html.includes(name), `${p} shows a teacher that exists only in the admin panel`);
});
