// Teacher notification switches are real (stored on the teacher, honoured by the actions that create notices),
// the bell panels' "mark all read" action works for teacher and student, and the <75 % attendance warning behaves.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, loginAs, makeWorld, sql, callAction, slot, TEACHER_ACTIONS, STUDENT_ACTIONS } from "./helpers.mjs";

let admin, w, tA, s1, s3, teacherUserId;
const prefs = () => sql(`select "notifySubmissions" s, "notifyAttendanceWarnings" a from "TeacherProfile" where "userId"=$1`, [teacherUserId]).then((r) => r[0]);
const warnings = (studentId) => sql(`select body from "Notification" where "userId"=$1 and title='Davamiyyət xəbərdarlığı' and "entityId"=$2`, [teacherUserId, studentId]);
const mkLessons = async (n, firstDaysAgo) => {
  const ids = [];
  for (let i = 0; i < n; i++) {
    const r = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(firstDaysAgo - i, 13) });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    ids.push(r.body.id);
  }
  return ids;
};

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
  [tA, s1, s3] = await Promise.all([w.teacherA, w.student1, w.student3].map((u) => loginAs(u.email, w.pw)));
  teacherUserId = (await sql(`select id from "User" where lower(email)=lower($1)`, [w.teacherA.email]))[0].id;
});

test("NOTIF-01 the two teacher switches are stored on the teacher (default on), validated, and survive a reload", async () => {
  assert.deepEqual(await prefs(), { s: true, a: true });
  assert.equal((await callAction(tA, TEACHER_ACTIONS, "updateNotificationPrefs", [{ submission: false, absence: true }])).value?.ok, true);
  assert.deepEqual(await prefs(), { s: false, a: true });
  assert.equal((await callAction(tA, TEACHER_ACTIONS, "updateNotificationPrefs", [{ submission: "yes", absence: 1 }])).value?.ok, false, "garbage refused");
  assert.deepEqual(await prefs(), { s: false, a: true }, "unchanged after a refused call");
  assert.notEqual((await callAction(s1, TEACHER_ACTIONS, "updateNotificationPrefs", [{ submission: true, absence: true }])).value?.ok, true, "a student cannot change teacher settings");
  assert.deepEqual(await prefs(), { s: false, a: true }, "teacher settings untouched by the student's attempt");
});

test("NOTIF-02 with the 'submission' switch off the teacher is not told about a hand-in; with it on they are", async () => {
  await mkLessons(1, 90); // homework hangs on a lesson of the class
  const hand = async (title) => {
    const hw = await callAction(tA, TEACHER_ACTIONS, "createHomework", [{ classId: w.classA.id, title, description: "Solve the QA tasks", dueDate: slot(-3).slice(0, 10), studentIds: [w.student1.id] }]);
    assert.equal(hw.value?.ok, true, JSON.stringify(hw.value));
    const sub = (await sql(`select id from "Submission" where "homeworkId"=$1`, [hw.value.id]))[0].id;
    assert.equal((await callAction(s1, STUDENT_ACTIONS, "submitHomework", [sub])).value?.ok, true);
    return sub;
  };
  const count = () => sql(`select count(*)::int n from "Notification" where "userId"=$1 and title='Yeni təhvil'`, [teacherUserId]).then((r) => r[0].n);
  const before = await count();
  await hand("QA notif off"); // switch is off from NOTIF-01
  assert.equal(await count(), before, "no notice while the switch is off");
  await callAction(tA, TEACHER_ACTIONS, "updateNotificationPrefs", [{ submission: true, absence: true }]);
  await hand("QA notif on");
  assert.equal(await count(), before + 1, "one notice while it is on");
});

test("NOTIF-03 attendance warning: needs 4 recorded lessons and < 75 %, is sent once a week per student, and respects the switch", async () => {
  const ls = await mkLessons(6, 120);
  const mark = (i, st) => callAction(tA, TEACHER_ACTIONS, "saveAttendance", [ls[i], { [w.student3.id]: st, [w.student1.id]: "p" }]);
  for (let i = 0; i < 3; i++) assert.equal((await mark(i, "a")).value?.ok, true);
  assert.equal((await warnings(w.student3.id)).length, 0, "3 recorded lessons are too few for a rate");
  assert.equal((await mark(3, "a")).value?.ok, true);
  const first = await warnings(w.student3.id);
  assert.equal(first.length, 1, "4th lesson, 0 % -> one warning");
  assert.match(first[0].body, /0%/);
  assert.equal((await mark(4, "a")).value?.ok, true);
  assert.equal((await warnings(w.student3.id)).length, 1, "no second warning inside 7 days");
  assert.equal((await warnings(w.student1.id)).length, 0, "a student who attends gets none");
  // switch off: a different student crossing the line produces nothing
  await callAction(tA, TEACHER_ACTIONS, "updateNotificationPrefs", [{ submission: true, absence: false }]);
  const ls2 = await mkLessons(4, 140);
  for (let i = 0; i < 4; i++) await callAction(tA, TEACHER_ACTIONS, "saveAttendance", [ls2[i], { [w.student1.id]: "a" }]);
  assert.equal((await warnings(w.student1.id)).length, 0, "switch off -> no warning");
});

test("NOTIF-04 'mark all read' (the bell panel) clears the caller's unread notices only — teacher and student", async () => {
  const unread = (uid) => sql(`select count(*)::int n from "Notification" where "userId"=$1 and read=false`, [uid]).then((r) => r[0].n);
  const studentUser = (await sql(`select id from "User" where lower(email)=lower($1)`, [w.student1.email]))[0].id;
  assert.ok((await unread(teacherUserId)) > 0 && (await unread(studentUser)) > 0, "both have unread notices");
  const other = (await sql(`select id from "User" where lower(email)=lower($1)`, [w.student3.email]))[0].id;
  const otherBefore = await unread(other);
  assert.equal((await callAction(tA, TEACHER_ACTIONS, "markNotificationsRead", [])).value?.ok, true);
  assert.equal(await unread(teacherUserId), 0);
  assert.equal((await callAction(s1, STUDENT_ACTIONS, "markNotificationsRead", [])).value?.ok, true);
  assert.equal(await unread(studentUser), 0);
  assert.equal(await unread(other), otherBefore, "someone else's notices are untouched");
});
