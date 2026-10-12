// The lesson-based payment rule: every `lessonsPerCycle` (8) completed lessons of a (student, class) open ONE payment.
// Exact boundaries, retries, parallel requests, corrections, money integrity and who sees what.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, loginAs, makeWorld, sql, callAction, slot, TEACHER_ACTIONS } from "./helpers.mjs";

let admin, w, tA, s1, p1, lessons = [];
const done = (lessonId, ...studentIds) => tA.post(`/api/teacher/lessons/${lessonId}/complete`, { studentIds });
const payments = (studentId, classId = w.classA.id) => sql(`select id, cycle, status, amount, "lessonsFrom", "lessonsTo", "invoiceNo", "paidAt" from "Payment" where "studentId"=$1 and "classId"=$2 order by cycle`, [studentId, classId]);
const notices = (event, entityId) => sql(`select "userId" from "Notification" where event=$1 and "entityId"=$2`, [event, entityId]);

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
  [tA, s1, p1] = await Promise.all([w.teacherA, w.student1, w.parent1].map((u) => loginAs(u.email, w.pw)));
  // 20 past lessons on separate days (no timetable clashes)
  for (let i = 0; i < 20; i++) {
    const r = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(40 - i, 10) });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    lessons.push(r.body.id);
  }
});

test("BILL-01 lessons 1-7 open no payment, the 8th opens exactly one, the 9th none (boundary)", async () => {
  for (let i = 0; i < 7; i++) {
    const r = await done(lessons[i], w.student1.id);
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.items[0].completedLessons, i + 1);
    assert.equal(r.body.items[0].paymentsOpened, 0);
  }
  assert.equal((await payments(w.student1.id)).length, 0, "no payment before the 8th lesson");
  const eighth = await done(lessons[7], w.student1.id);
  assert.equal(eighth.body.items[0].paymentsOpened, 1);
  const p = await payments(w.student1.id);
  assert.equal(p.length, 1);
  assert.deepEqual([p[0].cycle, p[0].status, p[0].lessonsFrom, p[0].lessonsTo, p[0].amount], [1, "DUE", 1, 8, w.course.price]);
  assert.match(p[0].invoiceNo, /^INV-\d{4}-[0-9A-F]{8}$/);
  const ninth = await done(lessons[8], w.student1.id);
  assert.equal(ninth.body.items[0].paymentsOpened, 0);
  assert.equal((await payments(w.student1.id)).length, 1, "the 9th lesson must not open another");
  assert.equal(ninth.body.items[0].progress, 1, "progress restarts inside the new cycle");
});

test("BILL-02 the cycle is per student: a classmate with no completed lessons owes nothing", async () => {
  assert.equal((await payments(w.student3.id)).length, 0);
});

test("BILL-03 who is told, and what each panel shows", async () => {
  const [p] = await payments(w.student1.id);
  const admins = (await sql(`select count(*)::int n from "User" where role='ADMIN' and active`))[0].n;
  const due = await notices("PAYMENT_DUE", p.id);
  const recipients = new Set(due.map((n) => n.userId));
  assert.equal(due.length, admins + 2, "every admin + the parent + the student, once each");
  assert.equal(recipients.size, due.length, "nobody is notified twice");
  assert.ok(recipients.has((await sql(`select "userId" from "ParentProfile" where id=$1`, [w.parent1.id]))[0].userId), "the parent is told");
  const mine = await s1.get("/api/student/classes");
  assert.equal(mine.body.items.find((c) => c.id === w.classA.id).paymentDue, true, "the student sees the payment flag");
  const listed = await admin.get(`/api/admin/payments?status=DUE&q=${encodeURIComponent("Qaone")}`);
  assert.ok(listed.body.items.some((x) => x.id === p.id), "the admin payment list shows it");
  assert.ok((await p1.page("/parent")).html.includes("Ödəniş") || (await p1.page("/parent/notifications")).html.includes("Ödəniş vaxtıdır"), "the parent portal mentions the payment");
});

test("BILL-04 repeating the same completion changes nothing (retry safety)", async () => {
  const notesBefore = (await sql(`select count(*)::int n from "Notification" where event='PAYMENT_DUE'`))[0].n;
  const again = await done(lessons[7], w.student1.id);
  assert.equal(again.body.items[0].changed, false);
  assert.equal(again.body.items[0].completedLessons, 9);
  assert.equal((await payments(w.student1.id)).length, 1);
  assert.equal((await sql(`select count(*)::int n from "Notification" where event='PAYMENT_DUE'`))[0].n, notesBefore);
});

test("BILL-05 parallel completions of the same lesson cannot double count or open two payments", async () => {
  // bring student 3 to 7 completed lessons, then fire the decisive 8th lesson many times at once
  for (let i = 0; i < 7; i++) await done(lessons[i], w.student3.id);
  const results = await Promise.all(Array.from({ length: 12 }, () => done(lessons[7], w.student3.id)));
  assert.ok(results.every((r) => r.status === 200), results.map((r) => r.status).join());
  const p = await payments(w.student3.id);
  assert.equal(p.length, 1, "exactly one payment for 12 simultaneous requests");
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "studentId"=$1 and completed`, [w.student3.id]))[0].n, 8);
  assert.equal((await notices("PAYMENT_DUE", p[0].id)).length, (await sql(`select count(*)::int n from "User" where role='ADMIN' and active`))[0].n + 2, "notified once, not twelve times");
});

test("BILL-06 parallel completions of DIFFERENT lessons crossing the boundary together open one payment", async () => {
  // student 1 has 9 completed; lessons 10..16 -> 16 completed. Do them all at once.
  const out = await Promise.all(lessons.slice(9, 16).map((id) => done(id, w.student1.id)));
  assert.ok(out.every((r) => r.status === 200), out.map((r) => r.status).join());
  const p = await payments(w.student1.id);
  assert.deepEqual(p.map((x) => x.cycle), [1, 2], "cycle 2 opened exactly once");
  assert.deepEqual([p[1].lessonsFrom, p[1].lessonsTo], [9, 16]);
});

test("BILL-07 marking PAID closes the cycle for good; later lessons do not reopen it; money fields do not move", async () => {
  const [c1] = await payments(w.student1.id);
  const paid = await admin.patch(`/api/admin/payments/${c1.id}/status`, { status: "PAID" });
  assert.equal(paid.status, 200, JSON.stringify(paid.body));
  const row = (await payments(w.student1.id))[0];
  assert.deepEqual([row.status, !!row.paidAt, row.amount], ["PAID", true, c1.amount]);
  assert.ok((await notices("PAYMENT_PAID", c1.id)).length >= 1, "the family is told the payment was received");
  await done(lessons[16], w.student1.id);
  assert.equal((await payments(w.student1.id)).length, 2, "17th lesson: still two cycles");
  assert.equal((await payments(w.student1.id))[0].status, "PAID", "cycle 1 stays PAID");
  // idempotent + reversible + validated
  assert.equal((await admin.patch(`/api/admin/payments/${c1.id}/status`, { status: "PAID" })).status, 200);
  assert.equal((await sql(`select count(*)::int n from "Notification" where event='PAYMENT_PAID' and "entityId"=$1`, [c1.id]))[0].n, (await notices("PAYMENT_PAID", c1.id)).length);
  assert.equal((await admin.patch(`/api/admin/payments/${c1.id}/status`, { status: "BOGUS" })).status, 400);
  assert.equal((await admin.patch(`/api/admin/payments/no-such-id/status`, { status: "PAID" })).status, 404);
  assert.equal((await admin.patch(`/api/admin/payments/${c1.id}/status`, { status: "DUE" })).status, 200);
  assert.equal((await payments(w.student1.id))[0].paidAt, null, "re-opening clears the paid date");
  await admin.patch(`/api/admin/payments/${c1.id}/status`, { status: "PAID" });
  // the student's "payment due" flag follows the open cycle (cycle 2 is still DUE)
  assert.equal((await s1.get("/api/student/classes")).body.items.find((c) => c.id === w.classA.id).paymentDue, true);
});

test("BILL-08 a later price change never rewrites an existing payment", async () => {
  const before = await payments(w.student1.id);
  const up = await admin.patch(`/api/admin/courses/${w.course.id}`, { price: w.course.price + 50 });
  assert.equal(up.status, 200, JSON.stringify(up.body));
  try {
    assert.deepEqual((await payments(w.student1.id)).map((p) => p.amount), before.map((p) => p.amount));
  } finally {
    await admin.patch(`/api/admin/courses/${w.course.id}`, { price: w.course.price });
  }
});

test("BILL-09 correcting a mark lowers the count but never deletes or duplicates a payment", async () => {
  const [p3] = await payments(w.student3.id);
  const absent = await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [lessons[0], { [w.student3.id]: "a" }]);
  assert.deepEqual(absent.value, { ok: true, changed: 1 });
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "studentId"=$1 and completed`, [w.student3.id]))[0].n, 7);
  assert.deepEqual((await payments(w.student3.id)).map((p) => p.id), [p3.id], "payment kept");
  await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [lessons[0], { [w.student3.id]: "p" }]);
  assert.equal((await payments(w.student3.id)).length, 1, "going back to present does not open a second payment");
});

test("BILL-10 the UI path (attendance screen) and the REST path (lesson completed) feed the same counter", async () => {
  const before = (await sql(`select count(*)::int n from "Attendance" where "studentId"=$1 and completed`, [w.student1.id]))[0].n;
  await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [lessons[17], { [w.student1.id]: "p" }]);
  await done(lessons[17], w.student1.id);
  await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [lessons[17], { [w.student1.id]: "p" }]);
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "studentId"=$1 and completed`, [w.student1.id]))[0].n, before + 1);
});

test("BILL-11 changing lessonsPerCycle mid-way opens the cycles that are due, once", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Cycle ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id], lessonsPerCycle: 8 });
  const ls = [];
  for (let i = 0; i < 7; i++) ls.push((await tA.post(`/api/teacher/classes/${cls.body.id}/lessons`, { date: slot(60 - i, 15) })).body.id);
  for (let i = 0; i < 5; i++) await done(ls[i], w.student3.id);
  assert.equal((await payments(w.student3.id, cls.body.id)).length, 0);
  assert.equal((await admin.patch(`/api/admin/classes/${cls.body.id}`, { lessonsPerCycle: 4 })).status, 200);
  await done(ls[5], w.student3.id); // 6 completed with cycle size 4 -> cycle 1 (lessons 1-4)
  const p = await payments(w.student3.id, cls.body.id);
  assert.deepEqual(p.map((x) => [x.cycle, x.lessonsFrom, x.lessonsTo]), [[1, 1, 4]]);
  await done(ls[6], w.student3.id); // 7 completed -> still one
  assert.equal((await payments(w.student3.id, cls.body.id)).length, 1);
});

test("BILL-12 the same student in two classes is billed per class", async () => {
  const other = await admin.post("/api/admin/classes", { name: `QA Second ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student1.id], lessonsPerCycle: 2 });
  const l1 = (await tA.post(`/api/teacher/classes/${other.body.id}/lessons`, { date: slot(70, 16) })).body.id;
  const l2 = (await tA.post(`/api/teacher/classes/${other.body.id}/lessons`, { date: slot(69, 16) })).body.id;
  await done(l1, w.student1.id); await done(l2, w.student1.id);
  assert.equal((await payments(w.student1.id, other.body.id)).length, 1);
  assert.equal((await payments(w.student1.id, w.classA.id)).length, 2, "class A cycles are untouched");
});

test("BILL-13 a payment cannot be changed by anybody but an admin", async () => {
  const [c1] = await payments(w.student1.id);
  const other = await loginAs(w.teacherB.email, w.pw);
  for (const c of [tA, other, s1, p1]) assert.equal((await c.patch(`/api/admin/payments/${c1.id}/status`, { status: "CANCELLED" })).status, 403);
});

// ------------------------------------------------------------------------------------------------ known weaknesses
test("BILL-14 a CANCELLED lesson cannot be marked completed (it would bill the family for a lesson that never happened)", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Cancel ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id], lessonsPerCycle: 1 });
  const l = (await tA.post(`/api/teacher/classes/${cls.body.id}/lessons`, { date: slot(80, 12) })).body.id;
  assert.equal((await admin.del(`/api/admin/lessons/${l}`)).status < 300, true, "admin cancels the lesson");
  assert.equal((await sql(`select status from "Lesson" where id=$1`, [l]))[0].status, "CANCELLED");
  const viaRest = await done(l, w.student3.id);
  const viaUi = await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [l, { [w.student3.id]: "p" }]);
  const billed = (await payments(w.student3.id, cls.body.id)).length;
  assert.ok(viaRest.status >= 400 && viaUi.value?.ok === false && billed === 0, `rest=${viaRest.status} ui=${JSON.stringify(viaUi.value)} payments=${billed}`);
});

test("BILL-15 an attendance mark on a cancelled lesson is refused and a cancelled lesson cannot be rescheduled", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Cancel2 ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id] });
  const l = (await tA.post(`/api/teacher/classes/${cls.body.id}/lessons`, { date: slot(81, 12) })).body.id;
  await admin.del(`/api/admin/lessons/${l}`);
  const r = await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [l, { [w.student3.id]: "a" }]);
  assert.equal(r.value?.ok, false);
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "lessonId"=$1`, [l]))[0].n, 0);
});

test("BILL-16 (business decision) a lesson that has not happened yet can be completed — the rule is not defined", { todo: "needs a product decision: allow only once the lesson has started?" }, async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Future ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id], lessonsPerCycle: 1 });
  const l = (await tA.post(`/api/teacher/classes/${cls.body.id}/lessons`, { date: slot(-30, 12) })).body.id;
  const r = await done(l, w.student3.id);
  assert.ok(r.status >= 400, `a lesson 30 days in the future was completed and billed (HTTP ${r.status})`);
});
