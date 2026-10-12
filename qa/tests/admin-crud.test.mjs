// Admin CRUD lifecycles, input validation, uniqueness under concurrency, and the cleanliness of the audit trail.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { Client, ADMIN, loginAs, makeWorld, sql, slot, tag } from "./helpers.mjs";

let admin, w;
const PW = "Passw0rd!x";
before(async () => { admin = await loginAs(ADMIN.email, ADMIN.password); w = await makeWorld(admin); });
const body = (r) => JSON.stringify(r.body).slice(0, 300);

// ================================================================================================ teachers
test("CRUD-T1 teacher lifecycle: create, read, search, update, deactivate (blocked while teaching), reactivate", async () => {
  const t = tag();
  const email = `qa.crud.teacher.${t}@qa.test`;
  const c = await admin.post("/api/admin/teachers", { name: `QA Crud Teacher ${t}`, email, password: PW, position: "QA", bio: "bio", experienceYears: 3, specializations: ["Python"] });
  assert.equal(c.status, 201, body(c));
  const id = c.body.id;
  assert.equal((await admin.get(`/api/admin/teachers/${id}`)).body.email, email);
  assert.ok((await admin.get(`/api/admin/teachers/search?q=${t}`)).body.items.some((x) => x.id === id));
  const up = await admin.patch(`/api/admin/teachers/${id}`, { position: "Senior QA", experienceYears: 5, phone: "0501112233" });
  assert.equal(up.status, 200, body(up));
  assert.deepEqual([up.body.position, up.body.experienceYears], ["Senior QA", 5]);
  const cls = await admin.post("/api/admin/classes", { name: `QA T1 ${t}`, courseId: w.course.id, teacherId: id, studentIds: [] });
  const blocked = await admin.patch(`/api/admin/teachers/${id}`, { active: false });
  assert.equal(blocked.status, 409, "a teacher with an active class cannot be deactivated");
  await admin.patch(`/api/admin/classes/${cls.body.id}`, { status: "ARCHIVED" });
  assert.equal((await admin.patch(`/api/admin/teachers/${id}`, { active: false })).status, 200);
  assert.equal((await admin.post("/api/admin/classes", { name: `QA T1b ${t}`, courseId: w.course.id, teacherId: id, studentIds: [] })).status, 404, "an inactive teacher cannot be assigned");
  assert.equal((await admin.patch(`/api/admin/teachers/${id}`, { active: true })).status, 200);
  assert.equal(await new Client().login(email, PW), true);
});

test("CRUD-T2 teacher validation and unknown ids", async () => {
  const ok = { name: "QA Valid Teacher", email: `qa.v.${tag()}@qa.test`, password: PW, position: "QA" };
  const cases = { "short password": { password: "short" }, "long password": { password: "x".repeat(200) }, "bad e-mail": { email: "nope" }, "empty name": { name: "" }, "no position": { position: "" }, "negative experience": { experienceYears: -1 }, "huge bio": { bio: "x".repeat(5000) }, "13 tags": { specializations: Array.from({ length: 13 }, (_, i) => `t${i}`) } };
  for (const [label, patch] of Object.entries(cases)) assert.equal((await admin.post("/api/admin/teachers", { ...ok, ...patch })).status, 400, label);
  assert.equal((await admin.post("/api/admin/teachers", "garbage")).status, 400);
  for (const m of ["get", "patch"]) assert.equal((await admin[m]("/api/admin/teachers/no-such-teacher", m === "patch" ? { position: "QA position" } : undefined)).status, 404);
});

// ================================================================================================ uniqueness / concurrency
for (const [label, path, mk] of [
  ["teacher", "/api/admin/teachers", (e) => ({ name: "QA Race Teacher", email: e, password: PW, position: "QA" })],
  ["parent", "/api/admin/parents", (e) => ({ name: "QA Race Parent", email: e, password: PW })],
  ["student", "/api/admin/students", (e) => ({ firstName: "Race", lastName: "Student", email: e, password: PW, birthDate: "2014-01-01", parentId: null })],
]) {
  test(`CRUD-U1 ${label}: the same e-mail submitted 6 times at once creates one account and answers 409, never 500`, async () => {
    const email = `qa.race.${label}.${tag()}@qa.test`;
    const payload = mk(email);
    if (label === "student") payload.parentId = w.parent1.id;
    const out = await Promise.all(Array.from({ length: 6 }, () => admin.post(path, payload)));
    const codes = out.map((r) => r.status).sort();
    assert.equal((await sql(`select count(*)::int n from "User" where email=$1`, [email]))[0].n, 1, "exactly one user row");
    assert.deepEqual(codes, [201, 409, 409, 409, 409, 409], `statuses: ${codes}`);
  });
}

test("CRUD-U2 e-mail uniqueness ignores case and surrounding spaces, across roles", async () => {
  const t = tag();
  const base = `qa.case.${t}@qa.test`;
  assert.equal((await admin.post("/api/admin/parents", { name: "QA Case Parent", email: base, password: PW })).status, 201);
  assert.equal((await admin.post("/api/admin/teachers", { name: "QA Case Teacher", email: ` ${base.toUpperCase()} `, password: PW, position: "QA" })).status, 409);
  assert.equal(await new Client().login(base.toUpperCase(), PW), true, "sign-in is case-insensitive too");
});

// ================================================================================================ students / parents
test("CRUD-S1 student validation: dates, grade, FIN uniqueness, parent required", async () => {
  const t = tag();
  const base = { firstName: "Valid", lastName: `Kid${t}`, email: `qa.s1.${t}@qa.test`, password: PW, birthDate: "2014-01-01", parentId: w.parent1.id };
  const bad = { "future birth date": { birthDate: "2999-01-01" }, "garbage date": { birthDate: "31-31-2014" }, "grade 0": { grade: 0 }, "grade 12": { grade: 12 }, "digits in name": { firstName: "R2D2" }, "no parent": { parentId: undefined }, "unknown parent": { parentId: "nope" }, "short FIN": { fin: "ABC" } };
  for (const [label, patch] of Object.entries(bad)) {
    const r = await admin.post("/api/admin/students", { ...base, ...patch });
    assert.ok([400, 404].includes(r.status), `${label}: ${r.status} ${body(r)}`);
  }
  const fin = "QA" + tag().toUpperCase().slice(0, 5);
  assert.equal((await admin.post("/api/admin/students", { ...base, fin })).status, 201);
  const dup = await admin.post("/api/admin/students", { ...base, email: `qa.s1b.${t}@qa.test`, fin: ` ${fin.toLowerCase()} ` });
  assert.equal(dup.status, 409, "the same FIN in another case/spacing is a duplicate");
  const found = await admin.get(`/api/admin/students/search?q=${fin}`);
  assert.equal((found.body.items ?? found.body).length, 1, "a 7-character FIN finds exactly that student");
});

test("CRUD-S2 deactivating a student blocks sign-in and removes them from pickers; reactivating restores both", async () => {
  const t = tag();
  const s = await admin.post("/api/admin/students", { firstName: "Toggle", lastName: `Kid${t}`, email: `qa.s2.${t}@qa.test`, password: PW, birthDate: "2014-01-01", parentId: w.parent1.id });
  assert.equal((await admin.patch(`/api/admin/students/${s.body.id}`, { active: false })).status, 200);
  assert.equal(await new Client().login(`qa.s2.${t}@qa.test`, PW), false);
  assert.equal((await admin.post(`/api/admin/classes/${w.classB.id}/students`, { studentIds: [s.body.id] })).status, 404, "an inactive student cannot be enrolled");
  assert.equal((await admin.patch(`/api/admin/students/${s.body.id}`, { active: true })).status, 200);
  assert.equal(await new Client().login(`qa.s2.${t}@qa.test`, PW), true);
});

test("CRUD-S3 an admin-set password takes effect at once and the old one stops working", async () => {
  const t = tag();
  const email = `qa.s3.${t}@qa.test`;
  const s = await admin.post("/api/admin/students", { firstName: "Pass", lastName: `Kid${t}`, email, password: PW, birthDate: "2014-01-01", parentId: w.parent1.id });
  assert.equal((await admin.patch(`/api/admin/students/${s.body.id}`, { password: "NewPassw0rd!2" })).status, 200);
  assert.equal(await new Client().login(email, PW), false);
  assert.equal(await new Client().login(email, "NewPassw0rd!2"), true);
  assert.equal((await admin.patch(`/api/admin/students/${s.body.id}`, { password: "short" })).status, 400);
});

test("CRUD-P1 moving a child to another parent moves access, payments and notifications with them", async () => {
  const t = tag();
  const a = await admin.post("/api/admin/parents", { name: `QA Move A ${t}`, email: `qa.pm.a.${t}@qa.test`, password: PW });
  const b = await admin.post("/api/admin/parents", { name: `QA Move B ${t}`, email: `qa.pm.b.${t}@qa.test`, password: PW });
  const kid = await admin.post("/api/admin/students", { firstName: "Moved", lastName: `Kid${t}`, email: `qa.pm.k.${t}@qa.test`, password: PW, birthDate: "2014-01-01", parentId: a.body.id });
  const cls = await admin.post("/api/admin/classes", { name: `QA Move Class ${t}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [kid.body.id] });
  const pa = await loginAs(`qa.pm.a.${t}@qa.test`, PW), pb = await loginAs(`qa.pm.b.${t}@qa.test`, PW);
  assert.ok((await pa.page("/parent")).html.includes(cls.body.name), "before the move the old parent sees the class");
  assert.ok(!(await pb.page("/parent")).html.includes(cls.body.name));
  await sql(`insert into "Payment" (id,"parentId","studentId",title,amount,status,"dueDate","invoiceNo") values ($1,$2,$3,'QA payment',100,'DUE',now(),$4)`, [`qa_pay_${t}`, a.body.id, kid.body.id, `INV-QA-${t}`]).catch(() => null);
  assert.equal((await admin.put(`/api/admin/students/${kid.body.id}/parent`, { parentId: b.body.id })).status, 200);
  assert.equal((await sql(`select "parentId" from "StudentProfile" where id=$1`, [kid.body.id]))[0].parentId, b.body.id);
  // old notifications legitimately keep naming the child, so judge by the portal's child list inside the page payload
  const emptyList = '\\"children\\":[],\\"notifications\\"';
  const hasChild = '\\"children\\":[{\\"id\\"';
  for (const page of ["/parent", "/parent/children", `/parent?child=${kid.body.id}`]) {
    const h = (await pa.page(page)).html;
    assert.ok(h.includes(emptyList) && !h.includes(hasChild), `${page}: the old parent still has the child`);
  }
  assert.ok((await pb.page("/parent")).html.includes(hasChild), "the new parent has the child");
  assert.equal((await sql(`select count(*)::int n from "StudentProfile" where "parentId"=$1`, [a.body.id]))[0].n, 0);
  const owner = await sql(`select "parentId" from "Payment" where "studentId"=$1`, [kid.body.id]);
  assert.ok(owner.every((r) => r.parentId === b.body.id), "payments follow the child");
  assert.equal((await sql(`select count(*)::int n from "Notification" where "userId"=(select "userId" from "ParentProfile" where id=$1) and event='GENERAL' and "entityId"=$2`, [b.body.id, kid.body.id]))[0].n, 1, "the new parent was told");
  assert.equal((await admin.put(`/api/admin/students/${kid.body.id}/parent`, { parentId: "no-such-parent" })).status, 404);
});

// ================================================================================================ courses & settings
test("CRUD-C1 course lifecycle: validation, duplicate slug, deactivate hides it from new classes but keeps existing ones", async () => {
  const t = tag();
  const mk = (over = {}) => ({ name: `QA Course ${t}`, shortDesc: "short description", longDesc: "", category: "qa", minAge: 8, maxAge: 14, level: "BEGINNER", durationMonths: 3, lessonsPerWeek: 2, lessonMinutes: 60, price: 120, modules: [{ title: "Module one" }], ...over });
  for (const [label, patch] of Object.entries({ "negative price": { price: -1 }, "max age below min": { minAge: 12, maxAge: 9 }, "no name": { name: "" }, "bad slug": { slug: "Bad Slug!" }, "bad level": { level: "GURU" } })) {
    assert.equal((await admin.post("/api/admin/courses", mk(patch))).status, 400, label);
  }
  const c = await admin.post("/api/admin/courses", mk({ slug: `qa-course-${t}` }));
  assert.equal(c.status, 201, body(c));
  assert.equal((await admin.post("/api/admin/courses", mk({ slug: `qa-course-${t}` }))).status, 409);
  const cls = await admin.post("/api/admin/classes", { name: `QA C1 ${t}`, courseId: c.body.id, teacherId: w.teacherA.id, studentIds: [] });
  assert.equal(cls.status, 201, body(cls));
  assert.equal((await admin.patch(`/api/admin/courses/${c.body.id}`, { active: false })).status, 200);
  assert.equal((await admin.post("/api/admin/classes", { name: `QA C1b ${t}`, courseId: c.body.id, teacherId: w.teacherA.id, studentIds: [] })).status, 404, "inactive course is not offered");
  assert.equal((await sql(`select count(*)::int n from "ClassGroup" where id=$1`, [cls.body.id]))[0].n, 1, "the existing class is kept");
});

test("CRUD-ST1 settings: validation, persistence, and the default cycle length applies to new classes only", async () => {
  const orig = (await admin.get("/api/admin/settings")).body;
  try {
    for (const bad of [{ "billing.lessonsPerCycle": 0 }, { "billing.lessonsPerCycle": 41 }, { "lesson.defaultMinutes": 5 }, { "school.email": "nope" }, { "notify.paymentDueToFamilies": "yes" }]) assert.equal((await admin.put("/api/admin/settings", bad)).status, 400, JSON.stringify(bad));
    assert.equal((await admin.put("/api/admin/settings", { "billing.lessonsPerCycle": 6 })).status, 200);
    assert.equal((await admin.get("/api/admin/settings")).body["billing.lessonsPerCycle"], 6);
    const fresh = await admin.post("/api/admin/classes", { name: `QA Cycle6 ${tag()}`, courseId: w.course.id, teacherId: w.teacherA.id, studentIds: [] });
    assert.equal(fresh.body.lessonsPerCycle, 6, "a new class takes the new default");
    assert.equal((await admin.get(`/api/admin/classes/${w.classA.id}`)).body.lessonsPerCycle, 8, "existing classes keep theirs");
  } finally {
    await admin.put("/api/admin/settings", { "billing.lessonsPerCycle": orig["billing.lessonsPerCycle"] });
  }
});

// ================================================================================================ lessons (admin)
test("CRUD-L1 admin lesson lifecycle: create, clash, reschedule, cancel; a completed lesson cannot be moved or cancelled", async () => {
  const t = tag();
  const cls = await admin.post("/api/admin/classes", { name: `QA L1 ${t}`, courseId: w.course.id, teacherId: w.teacherB.id, studentIds: [w.student2.id] });
  const mk = (d, extra = {}) => admin.post("/api/admin/lessons", { classId: cls.body.id, date: d, ...extra });
  const l = await mk(slot(-9, 10));
  assert.equal(l.status, 201, body(l));
  assert.equal((await mk(slot(-9, 10, 30))).status, 409, "overlap with itself");
  const room = await mk(slot(-9, 10), { room: "R1" });
  assert.ok([200, 201].includes(room.status));
  const up = await admin.patch(`/api/admin/lessons/${l.body.id}`, { date: slot(-9, 15) });
  assert.equal(up.status, 200, body(up));
  assert.equal((await admin.patch(`/api/admin/lessons/${l.body.id}`, { durationMinutes: 5 })).status, 400);
  const tB = await loginAs(w.teacherB.email, PW).catch(() => loginAs(w.teacherB.email, w.pw));
  assert.equal((await tB.post(`/api/teacher/lessons/${l.body.id}/complete`, { studentIds: [w.student2.id] })).status, 200);
  assert.equal((await admin.patch(`/api/admin/lessons/${l.body.id}`, { date: slot(-9, 16) })).status, 409, "a completed lesson cannot be moved");
  assert.equal((await admin.del(`/api/admin/lessons/${l.body.id}`)).status, 409, "a completed lesson cannot be cancelled");
  assert.equal((await admin.get("/api/admin/lessons/no-such-lesson")).status, 404);
});

// ================================================================================================ audit trail & notifications
test("AUD-1 every admin mutation is audited with the actor, and no secret ever reaches the trail", async () => {
  const t = tag();
  const email = `qa.aud.${t}@qa.test`;
  await admin.post("/api/admin/teachers", { name: `QA Audit ${t}`, email, password: "SecretPassw0rd!zz", position: "QA" });
  await admin.post("/api/admin/students", { firstName: "Audit", lastName: `Kid${t}`, email: `qa.aud.s.${t}@qa.test`, password: "SecretPassw0rd!zz", birthDate: "2014-01-01", parentId: w.parent1.id, fin: "QA" + t.toUpperCase().slice(0, 5) });
  const rows = await sql(`select action, "actorUserId", before, after from "AuditLog" order by "createdAt" desc limit 40`);
  assert.ok(rows.some((r) => r.action === "teacher.create") && rows.some((r) => r.action === "student.create"));
  const dump = JSON.stringify(rows);
  assert.ok(!/SecretPassw0rd|passwordHash|\$2[aby]\$|finEncrypted|finHash/.test(dump), "a password, hash or FIN material is in the audit log");
  assert.ok(!rows.slice(0, 5).some((r) => !r.actorUserId), "audit entries carry the actor");
  const api = await admin.get("/api/admin/audit?size=5");
  assert.ok(api.body.items.length > 0 && api.body.items[0].actor, "the audit API shows who");
});

test("AUD-2 admin notifications: list, mark read, and only admins can read them", async () => {
  const list = await admin.get("/api/admin/notifications");
  assert.equal(list.status, 200);
  const first = list.body.items[0];
  if (first) {
    const mark = await admin.patch("/api/admin/notifications", { ids: [first.id] });
    assert.ok(mark.status < 300, body(mark));
  }
  const bobby = await loginAs(w.teacherA.email, w.pw);
  assert.equal((await bobby.get("/api/admin/notifications")).status, 403);
});
