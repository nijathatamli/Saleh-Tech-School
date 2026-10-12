// Authorization boundaries: (1) every REST route against every role, discovered from the source tree so a new
// route cannot be forgotten; (2) object-level checks — a teacher/student/parent changing an id in a request
// or a URL must never reach somebody else's records (REST, server actions and server-rendered pages).
import test, { before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Client, ADMIN, loginAs, makeWorld, sql, callAction, slot, TEACHER_ACTIONS, STUDENT_ACTIONS, PARENT_ACTIONS } from "./helpers.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
let admin, w, anon, tA, tB, s1, s2, p1, p2;
let lessonA, hwA, submissionS1, noteA;

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
  anon = new Client("anon");
  [tA, tB, s1, s2, p1, p2] = await Promise.all([w.teacherA, w.teacherB, w.student1, w.student2, w.parent1, w.parent2].map((u) => loginAs(u.email, w.pw)));
  const les = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(1, 11) });
  assert.equal(les.status, 201, JSON.stringify(les.body));
  lessonA = les.body.id;
  const hw = await callAction(tA, TEACHER_ACTIONS, "createHomework", [{ classId: w.classA.id, title: "QA homework", description: "QA description", dueDate: slot(-3).slice(0, 10) }]);
  assert.equal(hw.value?.ok, true, JSON.stringify(hw.value));
  hwA = hw.value.id;
  submissionS1 = (await sql(`select id from "Submission" where "homeworkId"=$1 and "studentId"=$2`, [hwA, w.student1.id]))[0].id;
  const note = await callAction(tA, TEACHER_ACTIONS, "createStudentNote", [{ studentId: w.student1.id, body: "private QA note", visibility: "PRIVATE" }]);
  assert.equal(note.value?.ok, true, JSON.stringify(note.value));
  noteA = note.value.id;
});

// ------------------------------------------------------------------------------------------------ 1. route matrix
function discoverRoutes() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name === "route.ts") {
        const rel = path.relative(path.join(ROOT, "src/app/api"), dir);
        const src = fs.readFileSync(f, "utf8");
        const methods = [...src.matchAll(/export (?:const|async function) (GET|POST|PATCH|PUT|DELETE)\b/g)].map((m) => m[1]);
        const url = "/api/" + rel.split(path.sep).map((seg) => (/^\[.+\]$/.test(seg) ? "qa-missing-id" : seg)).join("/");
        out.push({ rel, url, methods });
      }
    }
  };
  walk(path.join(ROOT, "src/app/api"));
  return out;
}
const routes = discoverRoutes();
const OWNER = { admin: "ADMIN", teacher: "TEACHER", student: "STUDENT" };
const roleRoutes = routes.filter((r) => OWNER[r.rel.split(path.sep)[0]]);

test("RBAC-00 the route inventory is not empty and covers all three role areas", () => {
  assert.ok(roleRoutes.length >= 30, `only ${roleRoutes.length} role routes found`);
  for (const area of Object.keys(OWNER)) assert.ok(roleRoutes.some((r) => r.rel.startsWith(area)), `no routes for ${area}`);
});

test("RBAC-01 anonymous callers get 401 on every role route and every method", async () => {
  const bad = [];
  for (const r of roleRoutes) for (const m of r.methods) {
    const res = await anon.json(r.url, m, ["GET", "DELETE"].includes(m) ? undefined : {});
    if (res.status !== 401) bad.push(`${m} ${r.url} -> ${res.status}`);
  }
  assert.deepEqual(bad, []);
});

test("RBAC-02 a signed-in user of the wrong role gets 403 on every role route and every method", async () => {
  const clients = { ADMIN: admin, TEACHER: tA, STUDENT: s1, PARENT: p1 };
  const bad = [];
  for (const r of roleRoutes) {
    const owner = OWNER[r.rel.split(path.sep)[0]];
    for (const [role, c] of Object.entries(clients)) {
      if (role === owner) continue;
      for (const m of r.methods) {
        const res = await c.json(r.url, m, ["GET", "DELETE"].includes(m) ? undefined : {});
        if (res.status !== 403) bad.push(`${role} ${m} ${r.url} -> ${res.status}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("RBAC-03 the owning role reaches its routes (nothing is blocked for everybody) and unknown ids are 404, never 500", async () => {
  const bad = [];
  for (const r of roleRoutes) {
    const owner = OWNER[r.rel.split(path.sep)[0]];
    const c = { ADMIN: admin, TEACHER: tA, STUDENT: s1 }[owner];
    for (const m of r.methods) {
      const res = await c.json(r.url, m, ["GET", "DELETE"].includes(m) ? undefined : {});
      if (res.status >= 500) bad.push(`${owner} ${m} ${r.url} -> ${res.status} ${JSON.stringify(res.body).slice(0, 120)}`);
      // an id that is not the caller's own is "forbidden" on purpose (no hint whether it exists)
      const ownershipRoute = owner === "TEACHER" && /\/classes\/qa-missing-id\/|\/lessons\/qa-missing-id\//.test(r.url);
      if (res.status === 401 || (res.status === 403 && !ownershipRoute)) bad.push(`${owner} ${m} ${r.url} -> ${res.status} (owner refused)`);
    }
  }
  assert.deepEqual(bad, []);
});

test("RBAC-04 mutating admin/teacher/student routes refuse a foreign Origin", async () => {
  const bad = [];
  for (const r of roleRoutes) {
    const owner = OWNER[r.rel.split(path.sep)[0]];
    const c = { ADMIN: admin, TEACHER: tA, STUDENT: s1 }[owner];
    for (const m of r.methods.filter((x) => x !== "GET")) {
      const res = await c.json(r.url, m, m === "DELETE" ? undefined : {}, { origin: "https://evil.example" });
      if (res.status !== 403) bad.push(`${m} ${r.url} -> ${res.status}`);
    }
  }
  assert.deepEqual(bad, []);
});

// ------------------------------------------------------------------------------------------------ 2. REST object level
test("IDOR-01 teacher B cannot read or change teacher A's class over REST", async () => {
  assert.equal((await tB.get(`/api/teacher/classes/${w.classA.id}/students`)).status, 403);
  assert.equal((await tB.get(`/api/teacher/classes/${w.classA.id}/progress`)).status, 403);
  assert.equal((await tB.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(2, 12) })).status, 403);
  assert.equal((await tB.post(`/api/teacher/lessons/${lessonA}/complete`, { studentIds: [w.student1.id] })).status, 403);
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "lessonId"=$1`, [lessonA]))[0].n, 0, "no attendance was written");
});

test("IDOR-02 teacher and student class lists contain only the caller's own classes", async () => {
  const mine = await tA.get("/api/teacher/classes");
  const ids = (mine.body.items ?? mine.body).map((c) => c.id);
  assert.ok(ids.includes(w.classA.id) && !ids.includes(w.classB.id));
  const st = await s2.get("/api/student/classes");
  const sids = (st.body.items ?? st.body).map((c) => c.id);
  assert.ok(sids.includes(w.classB.id) && !sids.includes(w.classA.id));
});

test("IDOR-03 a teacher cannot complete a lesson for a student outside that class", async () => {
  const r = await tA.post(`/api/teacher/lessons/${lessonA}/complete`, { studentIds: [w.student2.id] });
  assert.ok([403, 404].includes(r.status), `status ${r.status}`);
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "lessonId"=$1`, [lessonA]))[0].n, 0);
});

// ------------------------------------------------------------------------------------------------ 3. server actions
const expectForbidden = (r, what) => assert.deepEqual([r.value?.ok, r.value?.error], [false, "forbidden"], `${what}: ${JSON.stringify(r.value)}`);

test("IDOR-04 teacher B cannot use any teacher server action on teacher A's records", async () => {
  expectForbidden(await callAction(tB, TEACHER_ACTIONS, "saveAttendance", [lessonA, { [w.student1.id]: "p" }]), "saveAttendance");
  expectForbidden(await callAction(tB, TEACHER_ACTIONS, "deleteLesson", [lessonA]), "deleteLesson");
  expectForbidden(await callAction(tB, TEACHER_ACTIONS, "createHomework", [{ classId: w.classA.id, title: "Hijack", description: "Hijack", dueDate: slot(-2).slice(0, 10) }]), "createHomework");
  expectForbidden(await callAction(tB, TEACHER_ACTIONS, "saveGrades", [[{ submissionId: submissionS1, score: 100 }]]), "saveGrades");
  expectForbidden(await callAction(tB, TEACHER_ACTIONS, "createStudentNote", [{ studentId: w.student1.id, body: "intruder note", visibility: "PARENT" }]), "createStudentNote");
  expectForbidden(await callAction(tB, TEACHER_ACTIONS, "deleteStudentNote", [noteA]), "deleteStudentNote");
  expectForbidden(await callAction(tB, TEACHER_ACTIONS, "updateSkillProgress", [{ studentId: w.student1.id, skill: "Hack", percent: 100 }]), "updateSkillProgress");
  const badge = (await sql(`select id from "Badge" limit 1`))[0].id;
  expectForbidden(await callAction(tB, TEACHER_ACTIONS, "awardBadge", [{ studentId: w.student1.id, badgeId: badge }]), "awardBadge");
  const after = await sql(`select (select count(*)::int from "Attendance" where "lessonId"=$1) att, (select count(*)::int from "StudentNote" where "studentId"=$2) notes, (select score from "Submission" where id=$3) score`, [lessonA, w.student1.id, submissionS1]);
  assert.deepEqual([after[0].att, after[0].notes, after[0].score], [0, 1, null], "nothing changed in the database");
});

test("IDOR-05 other roles cannot use teacher server actions at all", async () => {
  for (const [who, c] of [["student", s1], ["parent", p1], ["anonymous", anon]]) {
    const r = await callAction(c, TEACHER_ACTIONS, "saveAttendance", [lessonA, { [w.student1.id]: "p" }]);
    assert.ok(r.value?.ok === false || r.status >= 300, `${who}: ${r.status} ${JSON.stringify(r.value)}`);
  }
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "lessonId"=$1`, [lessonA]))[0].n, 0);
});

test("IDOR-06 a student cannot hand in another student's homework", async () => {
  const r = await callAction(s2, STUDENT_ACTIONS, "submitHomework", [submissionS1]);
  expectForbidden(r, "submitHomework");
  assert.equal((await sql(`select status from "Submission" where id=$1`, [submissionS1]))[0].status, "PENDING");
  const own = await callAction(s1, STUDENT_ACTIONS, "submitHomework", [submissionS1]);
  assert.equal(own.value?.ok, true, "the owner can");
});

test("IDOR-07 a parent cannot mark another user's notification as read", async () => {
  const [n] = await sql(`select n.id from "Notification" n join "ParentProfile" pp on pp."userId" = n."userId" where pp.id=$1 and n.read=false limit 1`, [w.parent2.id]);
  const target = n?.id ?? (await sql(`select id from "Notification" where "userId"=$1 limit 1`, [w.parent2.id]))[0]?.id;
  assert.ok(target, "parent 2 has a notification from the class enrolment");
  await callAction(p1, PARENT_ACTIONS, "markOneAsRead", [target]);
  assert.equal((await sql(`select read from "Notification" where id=$1`, [target]))[0].read, false);
});

// ------------------------------------------------------------------------------------------------ 4. pages
const names = () => ({ s1: `Qaone Student${w.tag}`, s2: `Qatwo Student${w.tag}`, s3: `Qathree Student${w.tag}`, cA: w.classA.name, cB: w.classB.name });

test("IDOR-08 a parent's portal never contains another family's child or class", async () => {
  const n = names();
  for (const path of ["/parent", "/parent/children", "/parent/attendance", "/parent/homework", `/parent?child=${w.student1.id}`, `/parent?child=${w.student2.id}`, `/parent/children?child=${w.student1.id}`]) {
    const html = (await p2.page(path)).html;
    if (["/parent", "/parent/children"].includes(path)) assert.ok(html.includes(n.s2), `${path}: parent 2 does not see own child`);
    assert.ok(!html.includes(n.s1) && !html.includes(n.s3) && !html.includes(n.cA), `${path}: parent 2 sees family 1's data`);
  }
  for (const path of ["/parent", "/parent/children", `/parent?child=${w.student2.id}`]) {
    const html = (await p1.page(path)).html;
    assert.ok(!html.includes(n.s2) && !html.includes(n.cB), `${path}: parent 1 sees family 2's data`);
  }
});

test("IDOR-09 teacher pages only expose the teacher's own classes and students; foreign ids are 404", async () => {
  const n = names();
  for (const path of ["/teacher", "/teacher/classes", "/teacher/students", "/teacher/homework"]) {
    const html = (await tB.page(path)).html;
    assert.ok(!html.includes(n.cA) && !html.includes(n.s1) && !html.includes(n.s3), `${path}: teacher B sees class A data`);
  }
  for (const path of [`/teacher/classes/${w.classA.id}`, `/teacher/classes/${w.classA.id}/attendance`, `/teacher/students/${w.student1.id}`, `/teacher/homework/${hwA}/grade`]) {
    assert.equal((await tB.page(path)).status, 404, path);
    assert.equal((await tA.page(path)).status, 200, `${path} for the owner`);
  }
});

test("IDOR-10 student pages never contain another student's private data (grades, notes, homework, email)", async () => {
  const html = (await s2.page("/student")).html + (await s2.page("/student/homework")).html + (await s2.page("/student/attendance")).html;
  assert.ok(!html.includes("QA homework"), "student 2 sees class A's homework");
  assert.ok(!html.includes("private QA note"), "private teacher note leaked");
  assert.ok(!html.includes(w.student1.email) && !html.includes(w.parent1.email), "e-mail addresses of other accounts are in the page");
});

test("IDOR-11 the private teacher note is invisible to the student and the parent", async () => {
  for (const c of [s1, p1]) for (const pth of ["/student", "/parent", "/parent/children"]) {
    if (c === s1 && pth !== "/student") continue;
    if (c === p1 && pth === "/student") continue;
    assert.ok(!(await c.page(pth)).html.includes("private QA note"), `${pth}`);
  }
});

// ------------------------------------------------------------------------------------------------ 5. mass assignment
test("IDOR-12 privileged fields in request bodies are ignored (no role escalation)", async () => {
  const t = w.tag;
  const r = await admin.post("/api/admin/parents", { name: `QA Mass ${t}`, email: `qa.mass.${t}@qa.test`, password: "Passw0rd!x", role: "ADMIN", active: false, id: "hijacked" });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const row = (await sql(`select role, active, id from "User" where email=$1`, [`qa.mass.${t}@qa.test`]))[0];
  assert.deepEqual([row.role, row.active], ["PARENT", true]);
  assert.notEqual(row.id, "hijacked");
  const up = await admin.patch(`/api/admin/teachers/${w.teacherA.id}`, { role: "ADMIN", userId: "x", passwordHash: "x" });
  assert.ok(up.status < 500);
  assert.equal((await sql(`select role from "User" where email=$1`, [w.teacherA.email.toLowerCase()]))[0].role, "TEACHER");
  assert.equal(await new Client().login(w.teacherA.email, w.pw), true, "password hash untouched");
});

test("IDOR-13 the password hash and other secrets never appear in any admin API response", async () => {
  const bad = [];
  for (const u of ["/api/admin/teachers", "/api/admin/parents", "/api/admin/students", `/api/admin/classes/${w.classA.id}`, `/api/admin/teachers/${w.teacherA.id}`, `/api/admin/parents/${w.parent1.id}`, `/api/admin/students/${w.student1.id}`]) {
    const res = await admin.get(u);
    const txt = JSON.stringify(res.body);
    if (/passwordHash|\$2[aby]\$/.test(txt)) bad.push(`${u} leaks a password hash`);
    if (/finHash|finEncrypted/.test(txt)) bad.push(`${u} leaks FIN material`);
  }
  assert.deepEqual(bad, []);
});

test("IDOR-14 a server action called with a foreign Origin is refused and changes nothing (cross-site request forgery)", async () => {
  const { actionId, BASE: base } = await import("./helpers.mjs");
  const before = (await sql(`select count(*)::int n from "Attendance" where "lessonId"=$1`, [lessonA]))[0].n;
  const res = await tA.raw("/teacher", {
    method: "POST",
    headers: { "next-action": actionId("teacher/[[...slug]]", "saveAttendance"), accept: "text/x-component", "content-type": "text/plain;charset=UTF-8", origin: "https://evil.example" },
    body: JSON.stringify([lessonA, { [w.student1.id]: "p" }]),
  });
  const text = await res.text();
  assert.ok(res.status >= 400 || !/"ok":true/.test(text), `foreign-origin action was accepted: ${res.status} ${text.slice(0, 120)}`);
  assert.equal((await sql(`select count(*)::int n from "Attendance" where "lessonId"=$1`, [lessonA]))[0].n, before, "nothing was written");
  void base;
});
