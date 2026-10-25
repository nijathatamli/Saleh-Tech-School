// Files attached to homework: what a teacher may upload, how they are stored and linked, and who can download them.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, BASE, Client, loginAs, makeWorld, callAction, sql, slot, TEACHER_ACTIONS } from "./helpers.mjs";

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const ZIP = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(40, 1)]);

let admin, w, tA, tB, s1, s2, p1, p2;
const upload = async (c, name, bytes, type = "application/octet-stream") => {
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type }), name);
  const res = await c.raw("/api/teacher/homework-files", { method: "POST", body: fd });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
};
const download = (c, id) => c.raw(`/api/files/homework/${id}`);
const homeworks = (title) => sql(`select id from "Homework" where title=$1`, [title]);
const mkHomework = async (title, attachmentIds, extra = {}) => callAction(tA, TEACHER_ACTIONS, "createHomework", [{ classId: w.classA.id, title, description: "QA fayllı tapşırıq", dueDate: slot(-4).slice(0, 10), attachmentIds, ...extra }]);

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
  [tA, tB, s1, s2, p1, p2] = await Promise.all([w.teacherA, w.teacherB, w.student1, w.student2, w.parent1, w.parent2].map((u) => loginAs(u.email, w.pw)));
  assert.equal((await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(2, 13) })).status, 201);
});

test("FILE-01 upload rules: only teachers; type from name AND content; size, empty and hostile names", async () => {
  const anon = new Client("anon");
  assert.equal((await upload(anon, "a.pdf", PDF)).status, 401);
  assert.equal((await upload(s1, "a.pdf", PDF)).status, 403, "a student cannot upload homework files");
  assert.equal((await upload(p1, "a.pdf", PDF)).status, 403);
  const ok = await upload(tA, "Tapşırıq vərəqi.pdf", PDF, "application/pdf");
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  assert.equal(ok.body.name, "Tapşırıq vərəqi.pdf", "Azerbaijani letters are kept");
  assert.equal(ok.body.size, PDF.length);
  assert.equal((await upload(tA, "virus.exe", Buffer.from("MZ......"))).status, 415, "executables refused");
  assert.equal((await upload(tA, "page.html", Buffer.from("<script>alert(1)</script>"), "text/html")).status, 415, "html refused");
  assert.equal((await upload(tA, "pic.svg", Buffer.from("<svg onload=alert(1)/>"), "image/svg+xml")).status, 415, "svg refused");
  assert.equal((await upload(tA, "evil.pdf.exe", PDF)).status, 415, "the last extension decides");
  assert.equal((await upload(tA, "fake.pdf", PNG, "application/pdf")).status, 415, "a .pdf whose bytes are a picture is refused");
  assert.equal((await upload(tA, "fake.png", PDF, "image/png")).status, 415);
  assert.equal((await upload(tA, "fake.docx", Buffer.from("just text"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).status, 415, "docx must be a zip container");
  assert.equal((await upload(tA, "bin.txt", Buffer.from([0x68, 0x69, 0x00, 0x01, 0x02]))).status, 415, "a .txt with NUL bytes is not text");
  assert.equal((await upload(tA, "empty.pdf", Buffer.alloc(0))).status, 400);
  assert.equal((await upload(tA, "noext", PDF)).status, 400);
  assert.equal((await upload(tA, "big.pdf", Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]))).status, 413, "over 10 MB");
  const trav = await upload(tA, "../../etc/passwd.txt", Buffer.from("hello"));
  assert.equal(trav.status, 201);
  assert.equal(trav.body.name, "passwd.txt", "directory parts are dropped");
  const code = await upload(tA, "robot.py", Buffer.from("print('salam')\n"));
  assert.equal(code.status, 201);
  const sb3 = await upload(tA, "oyun.sb3", ZIP);
  assert.equal(sb3.status, 201, "Scratch projects are zip containers");
  assert.equal((await tA.raw("/api/teacher/homework-files", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=x" }, body: "garbage" })).status >= 400, true, "malformed multipart is refused");
});

test("FILE-02 attached to a homework, the file reaches exactly the people it concerns", async () => {
  const a = (await upload(tA, "Vərəq №1.pdf", PDF, "application/pdf")).body;
  const b = (await upload(tA, "şəkil.png", PNG, "image/png")).body;
  const title = `QA fayllı ${Math.random().toString(36).slice(2, 8)}`;
  const r = await mkHomework(title, [a.id, b.id], { studentIds: [w.student1.id] });
  assert.equal(r.value?.ok, true, JSON.stringify(r.value));
  const hwId = r.value.id;
  assert.deepEqual((await sql(`select count(*)::int n from "HomeworkFile" where "homeworkId"=$1`, [hwId]))[0], { n: 2 });
  // the teacher, the assigned student, that student's parent and the admin can download
  for (const [who, c] of [["teacher", tA], ["assigned student", s1], ["parent of that student", p1], ["admin", admin]]) {
    const res = await download(c, a.id);
    assert.equal(res.status, 200, who);
    assert.equal(res.headers.get("content-type"), "application/pdf");
    assert.match(res.headers.get("content-disposition"), /^attachment; filename="[^"]*"; filename\*=UTF-8''.+/);
    assert.ok(decodeURIComponent(res.headers.get("content-disposition").split("filename*=UTF-8''")[1]).startsWith("Vərəq №1"), "Azerbaijani file name survives the header");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.match(res.headers.get("content-security-policy"), /sandbox/);
    assert.deepEqual(Buffer.from(await res.arrayBuffer()), PDF, `${who}: bytes are the uploaded bytes`);
  }
  assert.match((await download(s1, b.id)).headers.get("content-disposition"), /^inline/, "pictures may show inline");
  // everyone else gets "not found", never the file
  assert.equal((await download(new Client("anon"), a.id)).status, 401);
  assert.equal((await download(tB, a.id)).status, 404, "another teacher");
  assert.equal((await download(s2, a.id)).status, 404, "a student of another class");
  assert.equal((await download(p2, a.id)).status, 404, "a parent of another family");
  const s3 = await loginAs(w.student3.email, w.pw);
  assert.equal((await download(s3, a.id)).status, 404, "a classmate the homework was NOT assigned to (studentIds: [student1])");
  assert.equal((await download(s1, "nonexistent-id")).status, 404);
});

test("FILE-03 an unattached upload is private to its uploader; only unattached own files can be removed", async () => {
  const f = (await upload(tA, "gizli.pdf", PDF)).body;
  assert.equal((await download(tA, f.id)).status, 200, "the uploader can open it");
  for (const c of [tB, s1, p1]) assert.equal((await download(c, f.id)).status, 404);
  assert.equal((await tB.del(`/api/teacher/homework-files/${f.id}`)).status, 200, "(no-op for someone else's file)");
  assert.equal((await download(tA, f.id)).status, 200, "another teacher cannot delete it");
  assert.equal((await s1.del(`/api/teacher/homework-files/${f.id}`)).status, 403);
  assert.equal((await tA.del(`/api/teacher/homework-files/${f.id}`)).status, 200);
  assert.equal((await download(tA, f.id)).status, 404, "removed");
  // an attached file can no longer be removed through this endpoint
  const g = (await upload(tA, "tapsirigda.pdf", PDF)).body;
  const hw = await mkHomework(`QA attached ${g.id.slice(-6)}`, [g.id]);
  assert.equal(hw.value?.ok, true);
  await tA.del(`/api/teacher/homework-files/${g.id}`);
  assert.equal((await download(s1, g.id)).status, 200, "still there");
});

test("FILE-04 attaching is checked: someone else's file, a reused file, too many files and unknown ids make the whole homework fail", async () => {
  const before = (await sql(`select count(*)::int n from "Homework"`))[0].n;
  const theirs = (await upload(tB, "bunun.pdf", PDF)).body;
  const bad1 = await mkHomework("QA başqasının faylı", [theirs.id]);
  assert.notEqual(bad1.value?.ok, true, "a file uploaded by another teacher cannot be attached");
  assert.equal((await homeworks("QA başqasının faylı")).length, 0, "the homework was rolled back, not half-created");
  const mine = (await upload(tA, "bir.pdf", PDF)).body;
  assert.equal((await mkHomework("QA bir dəfə", [mine.id])).value?.ok, true);
  const reuse = await mkHomework("QA təkrar istifadə", [mine.id]);
  assert.notEqual(reuse.value?.ok, true, "a file already attached to a homework cannot be attached again");
  assert.equal((await homeworks("QA təkrar istifadə")).length, 0);
  const many = [];
  for (let i = 0; i < 6; i++) many.push((await upload(tA, `f${i}.txt`, Buffer.from(`x${i}`))).body.id);
  assert.notEqual((await mkHomework("QA çox fayl", many)).value?.ok, true, "more than 5 files");
  assert.equal((await homeworks("QA çox fayl")).length, 0);
  assert.notEqual((await mkHomework("QA yoxdur", ["no-such-file"])).value?.ok, true);
  const ok5 = await mkHomework("QA beş fayl", many.slice(0, 5));
  assert.equal(ok5.value?.ok, true, "exactly 5 is fine");
  assert.equal((await sql(`select count(*)::int n from "Homework"`))[0].n, before + 2, "only the two good homeworks exist");
  assert.equal((await mkHomework("QA fayl yoxdur", [])).value?.ok, true, "a homework without files still works");
});

test("FILE-05 deleting the homework's lesson/class data removes its files; the audit trail names the files", async () => {
  const f = (await upload(tA, "audit.pdf", PDF)).body;
  const title = `QA audit ${f.id.slice(-6)}`;
  const r = await mkHomework(title, [f.id]);
  const hwId = r.value.id;
  const audit = (await sql(`select after from "AuditLog" where action='homework.create' and "entityId"=$1`, [hwId]))[0];
  assert.deepEqual(audit.after.fileIds, [f.id]);
  const n = (await sql(`select body from "Notification" where "entityId"=$1 and body like '%Əlavə fayl: 1%' limit 1`, [hwId]));
  assert.equal(n.length, 1, "the students' notice mentions the attachment");
  await sql(`delete from "Homework" where id=$1`, [hwId]);
  assert.equal((await sql(`select count(*)::int n from "HomeworkFile" where id=$1`, [f.id]))[0].n, 0, "files go with their homework (ON DELETE CASCADE)");
});

test("FILE-06 the panels show the files: teacher's grading screen, student's and parent's homework lists link to the download", async () => {
  const f = (await upload(tA, "Panel faylı.pdf", PDF)).body;
  const title = `QA panel ${f.id.slice(-6)}`;
  const r = await mkHomework(title, [f.id], { studentIds: [w.student1.id] });
  assert.equal(r.value?.ok, true);
  const link = `/api/files/homework/${f.id}`;
  for (const [who, c, path] of [["student", s1, "/student/tasks"], ["student (phone list)", s1, "/student/homework"], ["parent", p1, "/parent/homework"], ["teacher grading", tA, `/teacher/homework/${r.value.id}/grade`]]) {
    const pg = await c.page(path);
    if (pg.status === 404) continue; // route names differ between panels; at least one of each must match (checked below)
    if (pg.html.includes(title)) assert.ok(pg.html.includes(link), `${who}: ${path} lists the homework but not its file link`);
  }
  const hits = [];
  for (const [c, paths] of [[s1, ["/student/tasks", "/student/homework", "/student"]], [p1, ["/parent/homework", "/parent/tasks", "/parent"]], [tA, [`/teacher/homework/${r.value.id}/grade`, "/teacher/homework"]]]) {
    let found = false;
    for (const p of paths) { const pg = await c.page(p); if (pg.html.includes(link) && pg.html.includes("Panel faylı.pdf")) { found = true; break; } }
    hits.push(found);
  }
  assert.deepEqual(hits, [true, true, true], "student, parent and teacher each see the file link and name somewhere in their panel");
  assert.ok(!(await s2.page("/student")).html.includes(link), "a student who was not assigned does not get the link");
});
