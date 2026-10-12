// Real races. These only mean something when the app runs with a real connection pool (DATABASE_POOL_MAX >= 5, the production default);
// with a pool of 1 every request is serialised by the driver and nothing can interleave.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, loginAs, makeWorld, sql, slot, tag } from "./helpers.mjs";

let admin, w, tA;
const par = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(i)));
before(async () => { admin = await loginAs(ADMIN.email, ADMIN.password); w = await makeWorld(admin); tA = await loginAs(w.teacherA.email, w.pw); });

test("RACE-01 two admins filling the last seat of a class at the same time: the capacity holds", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Race Cap ${tag()}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [], capacity: 1 });
  const out = await par(2, (i) => admin.post(`/api/admin/classes/${cls.body.id}/students`, { studentIds: [i ? w.student2.id : w.student3.id] }));
  const n = (await sql(`select count(*)::int n from "Enrollment" where "classId"=$1`, [cls.body.id]))[0].n;
  assert.equal(n, 1, `capacity 1 but ${n} students enrolled (statuses ${out.map((r) => r.status)})`);
});

test("RACE-02 the same student added to a class 6 times at once is enrolled once", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Race Dup ${tag()}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [] });
  const out = await par(6, () => admin.post(`/api/admin/classes/${cls.body.id}/students`, { studentIds: [w.student2.id] }));
  assert.equal((await sql(`select count(*)::int n from "Enrollment" where "classId"=$1 and "studentId"=$2`, [cls.body.id, w.student2.id]))[0].n, 1);
  assert.ok(out.every((r) => r.status < 500), `statuses ${out.map((r) => r.status)}`);
});

test("RACE-03 marking a payment PAID 6 times at once notifies the family once", async () => {
  const t = tag();
  await sql(`insert into "Payment" (id,"parentId","studentId","classId",title,amount,status,"dueDate","invoiceNo",cycle,"lessonsFrom","lessonsTo") values ($1,$2,$3,$4,'QA race payment',100,'DUE',now(),$5,901,1,8)`, [`qa_rp_${t}`, w.parent1.id, w.student1.id, w.classA.id, `INV-RACE-${t}`]);
  const out = await par(6, () => admin.patch(`/api/admin/payments/qa_rp_${t}/status`, { status: "PAID" }));
  assert.ok(out.every((r) => r.status === 200), `statuses ${out.map((r) => r.status)}`);
  assert.equal((await sql(`select count(*)::int n from "Notification" where event='PAYMENT_PAID' and "entityId"=$1`, [`qa_rp_${t}`]))[0].n, 1, "the family was notified more than once");
  assert.equal((await sql(`select count(*)::int n from "AuditLog" where action='payment.paid' and "entityId"=$1`, [`qa_rp_${t}`]))[0].n, 1, "the audit trail holds more than one 'paid' entry");
});

test("RACE-04 one teacher cannot be booked into two overlapping lessons by simultaneous requests", async () => {
  const c1 = await admin.post("/api/admin/classes", { name: `QA Race L1 ${tag()}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [] });
  const c2 = await admin.post("/api/admin/classes", { name: `QA Race L2 ${tag()}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [] });
  const when = slot(-40, 13, 0);
  const out = await par(6, (i) => admin.post("/api/admin/lessons", { classId: i % 2 ? c1.body.id : c2.body.id, date: when }));
  const ok = out.filter((r) => r.status === 201).length;
  const rows = (await sql(`select count(*)::int n from "Lesson" l join "ClassGroup" c on c.id=l."classId" where c."teacherId"=$1 and l.date=$2 and l.status<>'CANCELLED'`, [w.teacherA.id, new Date(`${when}:00+04:00`).toISOString()]))[0].n;
  assert.equal(rows, 1, `the teacher is booked ${rows} times at the same minute (created: ${ok}; statuses ${out.map((r) => r.status)})`);
});

test("RACE-05 the same lesson slot requested 6 times at once creates one lesson", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Race L3 ${tag()}`, courseId: w.course.id, teacherId: w.teacherB.id, studentIds: [] });
  const when = slot(-41, 11, 0);
  const tB = await loginAs(w.teacherB.email, w.pw);
  await par(6, () => tB.post(`/api/teacher/classes/${cls.body.id}/lessons`, { date: when }));
  assert.equal((await sql(`select count(*)::int n from "Lesson" where "classId"=$1 and status<>'CANCELLED'`, [cls.body.id]))[0].n, 1);
});

test("RACE-06 20 simultaneous completions across lessons produce exactly the right number of payment cycles", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Race Cycles ${tag()}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student1.id], lessonsPerCycle: 4 });
  const ls = [];
  for (let i = 0; i < 10; i++) ls.push((await tA.post(`/api/teacher/classes/${cls.body.id}/lessons`, { date: slot(90 + i, 9) })).body.id);
  const out = await par(10, (i) => tA.post(`/api/teacher/lessons/${ls[i]}/complete`, { studentIds: [w.student1.id] }));
  assert.ok(out.every((r) => r.status === 200), `statuses ${out.map((r) => r.status)}`);
  const pay = await sql(`select cycle from "Payment" where "classId"=$1 and "studentId"=$2 order by cycle`, [cls.body.id, w.student1.id]);
  assert.deepEqual(pay.map((p) => p.cycle), [1, 2], "10 completed lessons / 4 per cycle = exactly cycles 1 and 2");
});

test("RACE-07 two different teachers requesting the same room at the same minute at once: one gets it", async () => {
  const a = await admin.post("/api/admin/classes", { name: `QA Race Room A ${tag()}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [] });
  const b = await admin.post("/api/admin/classes", { name: `QA Race Room B ${tag()}`, courseId: w.course.id, teacherId: w.teacherB.id, studentIds: [] });
  const when = slot(-45, 16, 0), room = `RoomQA${tag()}`;
  const out = await par(6, (i) => admin.post("/api/admin/lessons", { classId: i % 2 ? a.body.id : b.body.id, date: when, room }));
  const n = (await sql(`select count(*)::int n from "Lesson" where lower(room)=lower($1) and status<>'CANCELLED'`, [room]))[0].n;
  assert.equal(n, 1, `the room is booked ${n} times at once (statuses ${out.map((r) => r.status)})`);
});
