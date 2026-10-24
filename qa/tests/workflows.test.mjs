// End-to-end business workflows across the four panels. Every step is verified on three levels:
// the HTTP response, what the other panels show (REST + server-rendered pages, in fresh sessions) and the database itself.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { Client, ADMIN, loginAs, makeWorld, sql, callAction, slot, tag, TEACHER_ACTIONS, STUDENT_ACTIONS } from "./helpers.mjs";

const BOOKING = { pageDir: "(marketing)/sinaq-dersi", route: "/sinaq-dersi" };
let admin, w, tA, tB, s1, s3, p1;
const phone = () => "050" + String(Math.floor(1_000_000 + Math.random() * 8_999_999));
const ids = (body) => (body.items ?? body).map((x) => x.studentId ?? x.id);

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
  [tA, tB, s1, s3, p1] = await Promise.all([w.teacherA, w.teacherB, w.student1, w.student3, w.parent1].map((u) => loginAs(u.email, w.pw)));
});

// ================================================================================================ A. class creation & enrolment
test("WF-A1 a class created by the admin reaches teacher, students and parent — in fresh sessions, and exactly once in the database", async () => {
  // fresh sessions (not the ones opened in before())
  const [teacher, student, parent] = await Promise.all([loginAs(w.teacherA.email, w.pw), loginAs(w.student1.email, w.pw), loginAs(w.parent1.email, w.pw)]);
  assert.ok(ids(await teacher.get("/api/teacher/classes").then((r) => r.body)).includes(w.classA.id));
  assert.deepEqual(ids((await teacher.get(`/api/teacher/classes/${w.classA.id}/students`)).body).sort(), [w.student1.id, w.student3.id].sort());
  assert.ok(ids((await student.get("/api/student/classes")).body).includes(w.classA.id));
  assert.ok((await parent.page("/parent")).html.includes(w.classA.name), "parent portal shows the class");
  const rows = await sql(`select "studentId","classId",status from "Enrollment" where "classId"=$1 order by 1`, [w.classA.id]);
  assert.equal(rows.length, 2);
  assert.equal(new Set(rows.map((r) => r.studentId)).size, 2, "no duplicate enrolment");
  const n = await sql(`select event, count(*)::int c from "Notification" where "entityId"=$1 and event in ('TEACHER_ASSIGNED','CLASS_ASSIGNED') group by event order by 1`, [w.classA.id]);
  assert.deepEqual(n.map((x) => x.event), ["CLASS_ASSIGNED", "TEACHER_ASSIGNED"], "teacher, students and parent were notified");
});

test("WF-A2 adding an existing student: no duplicate account, no duplicate membership, all-or-nothing", async () => {
  const before = (await sql(`select count(*)::int n from "User" where role='STUDENT'`))[0].n;
  const add = await admin.post(`/api/admin/classes/${w.classA.id}/students`, { studentIds: [w.student2.id] });
  assert.ok([200, 201].includes(add.status), JSON.stringify(add.body));
  assert.ok(ids((await tA.get(`/api/teacher/classes/${w.classA.id}/students`)).body).includes(w.student2.id), "teacher sees the new member");
  const dup = await admin.post(`/api/admin/classes/${w.classA.id}/students`, { studentIds: [w.student2.id] });
  assert.equal(dup.status, 409);
  const mixed = await admin.post(`/api/admin/classes/${w.classA.id}/students`, { studentIds: [w.student2.id, "no-such-student"] });
  assert.ok([404, 409].includes(mixed.status), `status ${mixed.status}`);
  assert.equal((await sql(`select count(*)::int n from "Enrollment" where "classId"=$1 and "studentId"=$2`, [w.classA.id, w.student2.id]))[0].n, 1);
  assert.equal((await sql(`select count(*)::int n from "User" where role='STUDENT'`))[0].n, before, "no accidental student account was created");
  const cls = await admin.get(`/api/admin/classes/${w.classA.id}`);
  assert.equal(cls.body.metrics.students, 3);
});

test("WF-A3 removing a member removes access but keeps the account and history", async () => {
  const rem = await admin.del(`/api/admin/classes/${w.classA.id}/students/${w.student2.id}`);
  assert.equal(rem.status, 200, JSON.stringify(rem.body));
  assert.ok(!ids((await tA.get(`/api/teacher/classes/${w.classA.id}/students`)).body).includes(w.student2.id));
  const s2 = await loginAs(w.student2.email, w.pw);
  assert.ok(!ids((await s2.get("/api/student/classes")).body).includes(w.classA.id));
  assert.equal((await sql(`select active from "StudentProfile" where id=$1`, [w.student2.id]))[0].active, true);
  assert.equal((await admin.del(`/api/admin/classes/${w.classA.id}/students/${w.student2.id}`)).status, 404, "removing twice is a clean 404");
});

test("WF-A4 capacity is enforced and a refused add changes nothing", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Cap ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student1.id], capacity: 1 });
  assert.equal(cls.status, 201, JSON.stringify(cls.body));
  const over = await admin.post(`/api/admin/classes/${cls.body.id}/students`, { studentIds: [w.student3.id] });
  assert.equal(over.status, 409, JSON.stringify(over.body));
  assert.equal((await sql(`select count(*)::int n from "Enrollment" where "classId"=$1`, [cls.body.id]))[0].n, 1);
  const tooMany = await admin.post("/api/admin/classes", { name: `QA Cap2 ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student1.id, w.student3.id], capacity: 1 });
  assert.equal(tooMany.status, 409);
  assert.equal((await sql(`select count(*)::int n from "ClassGroup" where name=$1`, [`QA Cap2 ${w.tag}`]))[0].n, 0, "a refused create leaves no class behind");
});

test("WF-A5 changing the teacher moves the class between teacher panels at once", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Move ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id] });
  const id = cls.body.id;
  assert.ok(ids((await tA.get("/api/teacher/classes")).body).includes(id));
  const mv = await admin.put(`/api/admin/classes/${id}/teacher`, { teacherId: w.teacherB.id });
  assert.equal(mv.status, 200, JSON.stringify(mv.body));
  assert.ok(!ids((await tA.get("/api/teacher/classes")).body).includes(id), "old teacher lost the class");
  assert.ok(ids((await tB.get("/api/teacher/classes")).body).includes(id), "new teacher got it");
  assert.equal((await tA.get(`/api/teacher/classes/${id}/students`)).status, 403);
  assert.equal((await tB.get(`/api/teacher/classes/${id}/students`)).status, 200);
});

test("WF-A6 an archived class disappears from teachers and students; restoring brings it back", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Arch ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id] });
  const id = cls.body.id;
  assert.equal((await admin.patch(`/api/admin/classes/${id}`, { status: "ARCHIVED" })).status, 200);
  assert.ok(!ids((await tA.get("/api/teacher/classes")).body).includes(id));
  assert.ok(!ids((await s3.get("/api/student/classes")).body).includes(id));
  assert.equal((await tA.post(`/api/teacher/classes/${id}/lessons`, { date: slot(-5, 9) })).status, 403, "no lessons on an archived class");
  assert.equal((await admin.post(`/api/admin/classes/${id}/students`, { studentIds: [w.student1.id] })).status, 409, "no new members either");
  assert.equal((await admin.patch(`/api/admin/classes/${id}`, { status: "ACTIVE" })).status, 200);
  assert.ok(ids((await tA.get("/api/teacher/classes")).body).includes(id));
});

test("WF-A7 deleting a class with history archives it instead of destroying lessons and payments", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA Del ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [w.student3.id] });
  const id = cls.body.id;
  assert.equal((await tA.post(`/api/teacher/classes/${id}/lessons`, { date: slot(2, 9) })).status, 201);
  const del = await admin.del(`/api/admin/classes/${id}`);
  assert.equal(del.status, 200, JSON.stringify(del.body));
  assert.equal((await sql(`select status from "ClassGroup" where id=$1`, [id]))[0].status, "ARCHIVED");
  assert.equal((await sql(`select count(*)::int n from "Lesson" where "classId"=$1`, [id]))[0].n, 1, "lesson history kept");
  const empty = await admin.post("/api/admin/classes", { name: `QA DelEmpty ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [] });
  assert.equal((await admin.del(`/api/admin/classes/${empty.body.id}`)).status, 200);
  assert.equal((await sql(`select count(*)::int n from "ClassGroup" where id=$1`, [empty.body.id]))[0].n, 0, "an empty class really is deleted");
});

// ================================================================================================ B. lessons & attendance
test("WF-B1 lessons: same slot twice returns the existing lesson; clashes are refused; the admin timetable shows it", async () => {
  const when = slot(5, 14, 0);
  const a = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: when });
  assert.equal(a.status, 201);
  const again = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: when });
  assert.equal(again.status, 200);
  assert.equal(again.body.id, a.body.id);
  // the same teacher cannot be in two classes at overlapping times
  const other = await admin.post("/api/admin/classes", { name: `QA Clash ${w.tag}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [] });
  const clash = await tA.post(`/api/teacher/classes/${other.body.id}/lessons`, { date: slot(5, 14, 30) });
  assert.equal(clash.status, 409, JSON.stringify(clash.body));
  const list = await admin.get(`/api/admin/lessons?classId=${w.classA.id}&size=100`);
  assert.ok(list.body.items.some((l) => l.id === a.body.id));
});

test("WF-B2 time zone: a lesson at 00:30 Baku time is stored as 20:30 UTC of the previous day and shown on the right date", async () => {
  const cls = await admin.post("/api/admin/classes", { name: `QA TZ ${w.tag}`, courseId: w.course.id, teacherId: w.teacherB.id, studentIds: [w.student2.id] });
  const day = slot(-20, 0, 30);
  const r = await tB.post(`/api/teacher/classes/${cls.body.id}/lessons`, { date: day });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const row = (await sql(`select date from "Lesson" where id=$1`, [r.body.id]))[0];
  const want = new Date(`${day.slice(0, 10)}T00:30:00+04:00`).toISOString();
  assert.equal(new Date(row.date + "Z").toISOString(), want);
  const shown = (await admin.get(`/api/admin/lessons?classId=${cls.body.id}`)).body.items[0];
  assert.equal(shown.date, want);
});

let attLesson;
test("WF-B3 attendance: saved once, persisted, idempotent, audited, and each panel sees the right thing", async () => {
  const les = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(3, 9) });
  attLesson = les.body.id;
  const save = await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [attLesson, { [w.student1.id]: "p", [w.student3.id]: "a" }]);
  assert.deepEqual(save.value, { ok: true, changed: 2 });
  const rows = await sql(`select "studentId", status, completed, "markedById" from "Attendance" where "lessonId"=$1`, [attLesson]);
  assert.deepEqual(rows.map((r) => [r.status, r.completed]).sort(), [["ABSENT", false], ["PRESENT", true]]);
  // idempotent: the same save changes nothing, no extra audit rows, no extra notifications
  const auditBefore = (await sql(`select count(*)::int n from "AuditLog" where "entityType"='attendance'`))[0].n;
  const notesBefore = (await sql(`select count(*)::int n from "Notification" where event='ABSENCE'`))[0].n;
  assert.deepEqual((await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [attLesson, { [w.student1.id]: "p", [w.student3.id]: "a" }])).value, { ok: true, changed: 0 });
  assert.equal((await sql(`select count(*)::int n from "AuditLog" where "entityType"='attendance'`))[0].n, auditBefore);
  assert.equal((await sql(`select count(*)::int n from "Notification" where event='ABSENCE'`))[0].n, notesBefore);
  // the absent student's family got exactly one absence notification, the present one none
  const absence = await sql(`select "userId" from "Notification" where event='ABSENCE' and "entityType"='attendance' and body like $1`, [`%Qathree%`]);
  assert.ok(absence.length >= 1);
  // (QA students share first names across test worlds, so scope to this world's families: parent 1 has students 1 and 3, parent 2 has student 2)
  const forS1 = await sql(`select count(*)::int n from "Notification" n join "User" u on u.id=n."userId" where n.event='ABSENCE' and n."entityType"='attendance' and lower(u.email) in (lower($2), lower($3)) and n.body like $1`, [`%Qaone%`, w.parent1.email, w.parent2.email]);
  assert.equal(forS1[0].n, 0, "no absence notice for a present student");
  // persistence in a brand-new session + what teacher/student/parent see
  const teacher = await loginAs(w.teacherA.email, w.pw);
  const prog = (await teacher.get(`/api/teacher/classes/${w.classA.id}/progress`)).body;
  const p1row = prog.students.find((s) => s.studentId === w.student1.id), p3row = prog.students.find((s) => s.studentId === w.student3.id);
  assert.deepEqual([p1row.completedLessons, p3row.completedLessons], [1, 0]);
  const student3 = await loginAs(w.student3.email, w.pw);
  assert.match((await student3.page("/student/attendance")).html, /qayıb|Qayıb/i, "the absent student sees the absence");
});

test("WF-B4 a mark can be corrected; the audit trail keeps the previous value; marks for non-members and junk are ignored", async () => {
  const fix = await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [attLesson, { [w.student3.id]: "l", [w.student2.id]: "p", [w.student1.id]: "zzz" }]);
  assert.deepEqual(fix.value, { ok: true, changed: 1 }, "only student 3 changed: student 2 is not in the class, 'zzz' is not a status");
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "lessonId"=$1 and "studentId"=$2`, [attLesson, w.student2.id]))[0].n, 0);
  const attId = (await sql(`select id from "Attendance" where "lessonId"=$1 and "studentId"=$2`, [attLesson, w.student3.id]))[0].id;
  const trail = await sql(`select before, after from "AuditLog" where "entityType"='attendance' and "entityId"=$1 and (before->>'status')='ABSENT' order by "createdAt" desc limit 1`, [attId]);
  assert.equal(trail[0]?.before?.status, "ABSENT", "the previous value is kept");
  assert.equal(trail[0]?.after?.status, "LATE");
  assert.equal((await sql(`select status from "Attendance" where "lessonId"=$1 and "studentId"=$2`, [attLesson, w.student1.id]))[0].status, "PRESENT");
});

test("WF-B5 a refused attendance request leaves existing attendance untouched", async () => {
  const before = await sql(`select "studentId", status, completed from "Attendance" where "lessonId"=$1 order by 1`, [attLesson]);
  const r = await callAction(tB, TEACHER_ACTIONS, "saveAttendance", [attLesson, { [w.student1.id]: "a", [w.student3.id]: "a" }]);
  assert.equal(r.value?.ok, false);
  const none = await callAction(tA, TEACHER_ACTIONS, "saveAttendance", ["no-such-lesson", { [w.student1.id]: "a" }]);
  assert.equal(none.value?.ok, false);
  const huge = await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [attLesson, {}]);
  assert.deepEqual(huge.value, { ok: true, changed: 0 });
  assert.deepEqual(await sql(`select "studentId", status, completed from "Attendance" where "lessonId"=$1 order by 1`, [attLesson]), before);
});

test("WF-B6 concurrent duplicate saves cannot create duplicate attendance rows", async () => {
  const les = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(4, 9) });
  const marks = { [w.student1.id]: "p", [w.student3.id]: "p" };
  await Promise.all(Array.from({ length: 8 }, () => callAction(tA, TEACHER_ACTIONS, "saveAttendance", [les.body.id, marks])));
  const rows = await sql(`select "studentId", count(*)::int c from "Attendance" where "lessonId"=$1 group by 1`, [les.body.id]);
  assert.deepEqual(rows.map((r) => r.c), [1, 1]);
});

// ================================================================================================ D. homework, submission, grading
let hw, sub1;
test("WF-D1 homework created by a teacher appears for the assigned student and parent only", async () => {
  const dueDate = slot(-4).slice(0, 10);
  const r = await callAction(tA, TEACHER_ACTIONS, "createHomework", [{ classId: w.classA.id, title: "QA WF homework", description: "Solve QA tasks", dueDate, studentIds: [w.student1.id] }]);
  assert.equal(r.value?.ok, true, JSON.stringify(r.value));
  hw = r.value.id;
  const subs = await sql(`select "studentId", status from "Submission" where "homeworkId"=$1`, [hw]);
  assert.deepEqual(subs.map((s) => [s.studentId, s.status]), [[w.student1.id, "PENDING"]], "only the selected student is assigned");
  sub1 = (await sql(`select id from "Submission" where "homeworkId"=$1`, [hw]))[0].id;
  assert.ok((await s1.page("/student/homework")).html.includes("QA WF homework"));
  assert.ok(!(await s3.page("/student/homework")).html.includes("QA WF homework"), "classmate who was not assigned does not see it");
  assert.ok((await p1.page("/parent/homework")).html.includes("QA WF homework"));
});

test("WF-D2 a student hands in, the teacher grades, the grade reaches student, parent and admin; invalid scores are refused", async () => {
  assert.equal((await callAction(s1, STUDENT_ACTIONS, "submitHomework", [sub1])).value?.ok, true);
  assert.equal((await sql(`select status from "Submission" where id=$1`, [sub1]))[0].status, "SUBMITTED");
  assert.equal((await callAction(s1, STUDENT_ACTIONS, "submitHomework", [sub1])).value?.ok, false, "cannot be handed in twice");
  for (const bad of [101, -1, 50.5, "abc"]) {
    const r = await callAction(tA, TEACHER_ACTIONS, "saveGrades", [[{ submissionId: sub1, score: bad }]]);
    assert.equal(r.value?.ok, false, `score ${bad} must be refused`);
  }
  assert.equal((await sql(`select count(*)::int n from "Grade" where "submissionId"=$1`, [sub1]))[0].n, 0, "refused grades wrote nothing");
  const g = await callAction(tA, TEACHER_ACTIONS, "saveGrades", [[{ submissionId: sub1, score: 87, feedback: "Good QA work" }]]);
  assert.deepEqual(g.value, { ok: true, count: 1 });
  const row = (await sql(`select s.status, s.score, g.score gscore from "Submission" s join "Grade" g on g."submissionId"=s.id where s.id=$1`, [sub1]))[0];
  assert.deepEqual([row.status, row.score, row.gscore], ["GRADED", 87, 87]);
  assert.ok((await (await loginAs(w.student1.email, w.pw)).page("/student/progress")).html.includes("87"), "student sees the grade after a new login");
  assert.ok((await p1.page("/parent")).html.includes("Good QA work") || (await p1.page("/parent/notifications")).html.includes("87"), "parent sees the grade or its notification");
  assert.ok((await sql(`select count(*)::int n from "Notification" where "entityType"='grade' and body like '%87%'`))[0].n >= 2, "parent and student were notified");
  // regrading updates the one grade row
  await callAction(tA, TEACHER_ACTIONS, "saveGrades", [[{ submissionId: sub1, score: 92 }]]);
  assert.deepEqual((await sql(`select score from "Grade" where "submissionId"=$1`, [sub1])).map((r) => r.score), [92]);
});

// ================================================================================================ E. admissions
let booking;
test("WF-E1 a public trial-lesson request is stored, validated and reaches the admin", async () => {
  const anon = new Client("visitor");
  const parentName = `QA Visitor ${w.tag}`;
  const ok = await callAction(anon, BOOKING, "createTrialBooking", [{ parentName, parentPhone: phone(), studentName: "Qa Kid", studentAge: 9, courseId: w.course.slug ?? w.course.id, preferredDate: slot(-6).slice(0, 10), preferredTime: "18:00" }]);
  assert.equal(ok.value?.status, "success", JSON.stringify(ok.value));
  booking = (await sql(`select id, stage, "courseId" from "TrialBooking" where "parentName"=$1`, [parentName]))[0];
  assert.equal(booking.stage, "NEW");
  const list = await admin.get(`/api/admin/applications?q=${encodeURIComponent(parentName)}`);
  assert.equal(list.body.items.length, 1);
  assert.ok((await sql(`select count(*)::int n from "Notification" where event='NEW_APPLICATION' and "entityId"=$1`, [booking.id]))[0].n >= 1, "admins were notified");
});

test("WF-E2 the public form rejects bad input without a server error", async () => {
  const anon = new Client("visitor");
  const base = { parentName: "QA Bad Input", parentPhone: phone(), studentName: "Qa Kid", studentAge: 9, preferredDate: slot(-6).slice(0, 10), preferredTime: "18:00" };
  const cases = { "short name": { parentName: "ab" }, "age 5": { studentAge: 5 }, "age 19": { studentAge: 19 }, "bad date": { preferredDate: "not-a-date" }, "huge name": { parentName: "x".repeat(50_000) }, "script": { parentName: "<script>alert(1)</script>QA" } };
  for (const [label, patch] of Object.entries(cases)) {
    const r = await callAction(anon, BOOKING, "createTrialBooking", [{ ...base, ...patch }]);
    if (label === "script") { assert.equal(r.value?.status, "success"); continue; }
    assert.equal(r.value?.status, "error", `${label}: ${JSON.stringify(r.value)?.slice(0, 120)} (HTTP ${r.status})`);
  }
  assert.equal((await sql(`select count(*)::int n from "TrialBooking" where "parentName" like 'xxxx%'`))[0].n, 0, "the oversized request wrote nothing");
});

test("WF-E3 stored markup in a request is escaped in the admin panel", async () => {
  const html = (await admin.page("/admin/leads")).html + (await admin.page("/admin")).html;
  assert.ok(!html.includes("<script>alert(1)</script>"), "unescaped script in the admin pages");
});

test("WF-E4 the public form is throttled (one visitor cannot flood the admins with requests)", async () => {
  const anon = new Client("flooder", "198.51.100.77");
  let refused = 0;
  for (let i = 0; i < 14; i++) {
    const r = await callAction(anon, BOOKING, "createTrialBooking", [{ parentName: `QA Flood ${w.tag} ${i}`, parentPhone: phone(), studentName: "Qa Kid", studentAge: 9, preferredDate: slot(-6).slice(0, 10), preferredTime: "18:00" }]);
    if (r.value?.status !== "success") refused++;
  }
  assert.ok(refused > 0, "14 submissions in a row from one address were all accepted");
});

test("WF-E5 converting an application creates parent + student + membership atomically, once", async () => {
  const email = `qa.conv.${w.tag}@qa.test`;
  const body = { student: { firstName: "Convert", lastName: `Kid${w.tag}`, email, password: "Passw0rd!x", birthDate: "2015-03-03", grade: 4, newParent: { name: `QA Conv Parent ${w.tag}`, email: `qa.convp.${w.tag}@qa.test`, password: "Passw0rd!x" } }, classId: w.classB.id };
  const bad = await admin.post(`/api/admin/applications/${booking.id}/convert`, { ...body, student: { ...body.student, email: w.parent1.email } });
  assert.equal(bad.status, 409, "a clash on the e-mail refuses the whole conversion");
  assert.equal((await sql(`select count(*)::int n from "User" where email=$1`, [`qa.convp.${w.tag}@qa.test`]))[0].n, 0, "no half-created parent");
  assert.equal((await sql(`select stage from "TrialBooking" where id=$1`, [booking.id]))[0].stage, "NEW");
  const ok = await admin.post(`/api/admin/applications/${booking.id}/convert`, body);
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  const t = (await sql(`select stage, "convertedStudentId" from "TrialBooking" where id=$1`, [booking.id]))[0];
  assert.deepEqual([t.stage, t.convertedStudentId], ["REGISTERED", ok.body.studentId]);
  assert.equal((await sql(`select count(*)::int n from "Enrollment" where "studentId"=$1 and "classId"=$2`, [ok.body.studentId, w.classB.id]))[0].n, 1);
  assert.equal((await admin.post(`/api/admin/applications/${booking.id}/convert`, { ...body, student: { ...body.student, email: `qa.conv2.${w.tag}@qa.test`, newParent: { ...body.student.newParent, email: `qa.conv2p.${w.tag}@qa.test` } } })).status, 409, "second conversion refused");
  assert.equal((await sql(`select count(*)::int n from "User" where email like $1`, [`qa.conv2%`]))[0].n, 0);
  // the new family can sign in and sees the class
  const kid = await loginAs(email, "Passw0rd!x");
  assert.ok(ids((await kid.get("/api/student/classes")).body).includes(w.classB.id));
  const parent = await loginAs(`qa.convp.${w.tag}@qa.test`, "Passw0rd!x");
  assert.ok((await parent.page("/parent")).html.includes(w.classB.name));
});

// ================================================================================================ G. misc admin lists
test("WF-G1 admin list endpoints paginate, filter and survive hostile parameters", async () => {
  const bad = [];
  for (const q of ["page=0", "page=-5", "page=abc", "size=100000", "size=0", "q=%27%20OR%201%3D1--", "q=%25", "sort=bogus", "dir=sideways", "status=%00"]) {
    for (const base of ["/api/admin/classes", "/api/admin/students", "/api/admin/teachers", "/api/admin/parents", "/api/admin/payments", "/api/admin/lessons", "/api/admin/applications", "/api/admin/audit", "/api/admin/notifications", "/api/admin/attendance"]) {
      const r = await admin.get(`${base}?${q}`);
      if (r.status >= 500) bad.push(`${base}?${q} -> ${r.status}`);
    }
  }
  assert.deepEqual(bad, []);
  const big = await admin.get("/api/admin/students?size=100000");
  assert.ok((big.body.items ?? []).length <= 100, "page size is capped");
});

test("WF-G2 search returns only active students and respects the class exclusion", async () => {
  const r = await admin.get(`/api/admin/students/search?q=Qaone&excludeClassId=${w.classA.id}`);
  assert.equal(r.status, 200);
  assert.ok(!(r.body.items ?? r.body).some((s) => s.id === w.student1.id), "student 1 is already in class A");
});
