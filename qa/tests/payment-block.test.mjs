// Admin: when a student's cycle of lessons is complete (payment DUE) the admin can confirm the payment ("Ödəniş etdi")
// or block the student's account until it arrives, and unblock it again. Blocking is the same switch as deactivation.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, Client, loginAs, makeWorld, sql, slot } from "./helpers.mjs";

let admin, w, tA, pay, studentUserId;
const state = async () => (await sql(`select p.active pa, u.active ua from "StudentProfile" p join "User" u on u.id=p."userId" where p.id=$1`, [w.student3.id]))[0];

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
  tA = await loginAs(w.teacherA.email, w.pw);
  const cls = await admin.post("/api/admin/classes", { name: `QA Block ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id], lessonsPerCycle: 1 });
  assert.equal(cls.status, 201, JSON.stringify(cls.body));
  const l = (await tA.post(`/api/teacher/classes/${cls.body.id}/lessons`, { date: slot(30, 11) })).body.id;
  assert.equal((await tA.post(`/api/teacher/lessons/${l}/complete`, { studentIds: [w.student3.id] })).status, 200);
  pay = (await sql(`select id, status from "Payment" where "studentId"=$1 and "classId"=$2`, [w.student3.id, cls.body.id]))[0];
  assert.equal(pay.status, "DUE", "completing the cycle opens a DUE payment");
  studentUserId = (await sql(`select "userId" from "StudentProfile" where id=$1`, [w.student3.id]))[0].userId;
});

test("PBLOCK-01 admin blocks the student from the payment: login stops, data stays, audited, family told; idempotent", async () => {
  const s = await loginAs(w.student3.email, w.pw);
  assert.equal((await s.get("/api/auth/session")).body?.user?.email?.toLowerCase(), w.student3.email.toLowerCase());
  const r = await admin.patch(`/api/admin/payments/${pay.id}/block`, { blocked: true });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.studentActive, false);
  assert.deepEqual(await state(), { pa: false, ua: false });
  assert.equal((await new Client("blocked").login(w.student3.email, w.pw)), false, "blocked student cannot sign in");
  assert.equal((await s.page("/student")).location?.includes("/giris") || (await s.page("/student")).status >= 300, true, "the open session stops at once");
  assert.equal((await sql(`select count(*)::int n from "AuditLog" where action='student.block' and "entityId"=$1`, [w.student3.id]))[0].n, 1);
  const told = await sql(`select count(*)::int n from "Notification" n join "ParentProfile" pp on pp."userId"=n."userId" join "StudentProfile" sp on sp."parentId"=pp.id where sp.id=$1 and n.title='Hesab bloklandı'`, [w.student3.id]);
  assert.equal(told[0].n, 1);
  assert.equal((await admin.patch(`/api/admin/payments/${pay.id}/block`, { blocked: true })).status, 200);
  assert.equal((await sql(`select count(*)::int n from "AuditLog" where action='student.block' and "entityId"=$1`, [w.student3.id]))[0].n, 1, "second identical request changes nothing");
});

test("PBLOCK-02 the payment page shows the state and the buttons exist for a DUE cycle", async () => {
  const html = (await admin.page(`/admin/payments?status=DUE&q=${encodeURIComponent(`Student${w.tag}`)}`)).html;
  assert.match(html, /Bloklanıb/);
  assert.match(html, /Blokdan çıxar/);
  assert.match(html, /Ödəniş etdi/);
});

test("PBLOCK-03 confirming the payment does not unblock by itself; the admin unblocks and the student can sign in again", async () => {
  assert.equal((await admin.patch(`/api/admin/payments/${pay.id}/status`, { status: "PAID" })).status, 200);
  assert.equal((await state()).ua, false, "paying does not silently reopen the account");
  assert.equal((await admin.patch(`/api/admin/payments/${pay.id}/block`, { blocked: false })).status, 200);
  assert.deepEqual(await state(), { pa: true, ua: true });
  assert.equal(await new Client("back").login(w.student3.email, w.pw), true);
  assert.equal((await sql(`select count(*)::int n from "AuditLog" where action='student.unblock' and "entityId"=$1`, [w.student3.id]))[0].n, 1);
});

test("PBLOCK-04 only admins can block; garbage and unknown ids are refused", async () => {
  const t = await loginAs(w.teacherA.email, w.pw);
  const p = await loginAs(w.parent1.email, w.pw);
  const s = await loginAs(w.student3.email, w.pw);
  for (const c of [t, p, s, new Client("anon")]) assert.ok([401, 403].includes((await c.patch(`/api/admin/payments/${pay.id}/block`, { blocked: true })).status));
  assert.deepEqual(await state(), { pa: true, ua: true }, "no one but an admin changed anything");
  assert.ok((await admin.patch(`/api/admin/payments/${pay.id}/block`, { blocked: "yes" })).status >= 400);
  assert.equal((await admin.patch(`/api/admin/payments/nonexistent/block`, { blocked: true })).status, 404);
});
