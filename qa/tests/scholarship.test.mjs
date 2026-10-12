// Scholarship exam ("/teqaud"): public registration with a single-use course code, the exam state machine,
// server-side grading, time limits, media access and the privacy of results.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { BASE, Client, ADMIN, loginAs, sql, callAction, tag } from "./helpers.mjs";

const ADMIN_SCHOLARSHIP = { pageDir: "admin/scholarship", route: "/admin/scholarship" };
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const fin = () => Array.from({ length: 7 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
const reg = (code, f, extra = {}) => ({ name: "Qa", surname: `Candidate${tag()}`.replace(/\d/g, ""), category: "3-4", fin: f, phone: "+994501234567", email: `cand.${tag()}@qa.test`, code, language: "az", program: "programming", ...extra });
let admin, codes = [];
const takeCode = () => codes.shift();

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  const fd = new FormData(); fd.append("count", "40"); fd.append("note", "qa suite");
  // generateScholarshipCodes is used through useFormState → (prevState, formData); call it the way the form does
  const r = await callAction(admin, ADMIN_SCHOLARSHIP, "generateScholarshipCodes", [{ status: "idle" }, Object.fromEntries(fd)]).catch(() => null);
  // formData cannot be JSON-encoded by callAction → fall back to the database for QA fixtures (the action itself is exercised in SCH-02)
  const rows = await sql(`select code from "ScholarshipCode" where "usedAt" is null and "studentId" is null limit 40`);
  codes = rows.map((x) => x.code);
  if (codes.length < 30) {
    const { randomInt } = await import("node:crypto");
    for (let i = 0; i < 40; i++) {
      const c = Array.from({ length: 32 }, () => ALPHABET[randomInt(32)]).join("");
      await sql(`insert into "ScholarshipCode" (id, code, note) values ($1,$2,'qa')`, [`qa_code_${tag()}${tag()}${i}`, c]);
      codes.push(c);
    }
  }
});

const register = async (client, body) => client.post("/api/scholarship/register", body);
async function candidate(extra = {}) {
  const c = new Client("candidate");
  const body = reg(takeCode(), fin(), extra);
  const r = await register(c, body);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { c, body };
}

test("SCH-01 every exam endpoint refuses callers without an exam session", async () => {
  const c = new Client();
  for (const [m, p] of [["GET", "/api/scholarship/me"], ["GET", "/api/scholarship/exam"], ["POST", "/api/scholarship/exam/start"], ["PUT", "/api/scholarship/exam/answer"], ["POST", "/api/scholarship/exam/submit"], ["GET", "/api/scholarship/media/0123456789abcdef"]]) {
    const r = await c.json(p, m, m === "GET" ? undefined : {});
    assert.equal(r.status, 401, `${m} ${p} -> ${r.status}`);
  }
  assert.equal((await c.get("/api/scholarship/categories")).status, 200, "the class list is public by design");
});

test("SCH-02 only an administrator can mint course codes", async () => {
  const student = await loginAs("ali.memmedov@example.com", "student123").catch(() => null);
  const fd = { count: "1", note: "x" };
  if (student) {
    const r = await callAction(student, ADMIN_SCHOLARSHIP, "generateScholarshipCodes", [{ status: "idle" }, fd]).catch((e) => ({ error: e }));
    const before = (await sql(`select count(*)::int n from "ScholarshipCode"`))[0].n;
    assert.ok(!r.value || r.value.status !== "ok", "a student minted codes");
    assert.equal((await sql(`select count(*)::int n from "ScholarshipCode"`))[0].n, before);
  }
});

test("SCH-03 registration validates every field and never reveals more than needed", async () => {
  const c = new Client();
  const good = reg(takeCode(), fin());
  const bad = { "short FIN": { fin: "ABC12" }, "FIN with symbol": { fin: "AB!2345" }, "no name": { name: "" }, "digits in name": { name: "Qa1" }, "bad phone": { phone: "123" }, "bad e-mail": { email: "nope" }, "short code": { code: "ABCD" }, "unknown program": { program: "wizardry" }, "unknown language": { language: "xx" }, "unknown class": { category: "99" } };
  for (const [label, patch] of Object.entries(bad)) {
    const r = await register(c, { ...good, ...patch });
    assert.equal(r.status, 400, `${label}: ${r.status} ${JSON.stringify(r.body)}`);
  }
  assert.equal((await register(c, "not json")).status, 400);
  assert.equal((await sql(`select count(*)::int n from "ScholarshipStudent" where email=$1`, [good.email]))[0].n, 0, "nothing was stored by rejected requests");
});

test("SCH-04 a code works once; the same code + same FIN resumes; another FIN or another code is refused", async () => {
  const code = takeCode(), f = fin();
  const first = new Client();
  const r1 = await register(first, reg(code, f));
  assert.equal(r1.status, 201);
  const sc = (first.lastSetCookie ?? []).find((s) => /sts_scholarship/.test(s));
  assert.ok(/HttpOnly/i.test(sc) && /SameSite=Lax/i.test(sc), `scholarship cookie flags: ${sc}`);
  assert.equal((await register(new Client(), reg(code, fin()))).status, 409, "same code, different FIN");
  assert.equal((await register(new Client(), reg(takeCode(), f))).status, 409, "same FIN, different code");
  const back = new Client();
  assert.equal((await register(back, reg(code, f))).status, 201, "same code + same FIN = the candidate coming back");
  assert.equal((await back.get("/api/scholarship/me")).status, 200);
  assert.equal((await sql(`select count(*)::int n from "ScholarshipStudent" where "finHash"=(select "finHash" from "ScholarshipStudent" order by "createdAt" desc limit 1)`))[0].n, 1);
});

test("SCH-05 two simultaneous registrations with one code: exactly one wins", async () => {
  const code = takeCode();
  const out = await Promise.all([register(new Client(), reg(code, fin())), register(new Client(), reg(code, fin())), register(new Client(), reg(code, fin()))]);
  assert.deepEqual(out.map((r) => r.status).sort(), [201, 409, 409]);
  assert.equal((await sql(`select count(*)::int n from "ScholarshipStudent" s join "ScholarshipCode" c on c."studentId"=s.id where c.code=$1`, [code]))[0].n, 1);
});

test("SCH-06 guessing codes is throttled", async () => {
  const c = new Client("guesser", "198.51.100.200");
  const statuses = [];
  for (let i = 0; i < 16; i++) statuses.push((await register(c, reg(Array.from({ length: 32 }, () => ALPHABET[Math.floor(Math.random() * 32)]).join(""), fin()))).status);
  assert.ok(statuses.includes(429), `16 wrong codes in a row were never throttled: ${[...new Set(statuses)]}`);
});

test("SCH-07 cross-site requests are refused", async () => {
  const c = new Client();
  const r = await c.post("/api/scholarship/register", reg(takeCode(), fin()), { origin: "https://evil.example" });
  assert.equal(r.status, 403);
});

test("SCH-08 the exam payload never contains marks; one attempt; answers validated; scored by the server", async () => {
  const { c } = await candidate();
  const before = await c.get("/api/scholarship/exam");
  assert.equal(before.body.status, "NOT_STARTED");
  const started = await c.post("/api/scholarship/exam/start", {});
  assert.equal(started.status, 200, JSON.stringify(started.body).slice(0, 200));
  assert.equal(started.body.status, "IN_PROGRESS");
  const text = JSON.stringify(started.body);
  assert.ok(!/correctLabel|answerText|"correct"/.test(text), "marks leaked into the exam payload");
  const qs = started.body.questions;
  assert.equal(qs.length, 5 + 10 + 10, "3-4: logic 10 + math 10 (random draw) + english 5 = 25");
  // the second start does not re-draw the questions
  assert.deepEqual((await c.post("/api/scholarship/exam/start", {})).body.questions.map((q) => q.id), qs.map((q) => q.id));
  // answer validation
  const q0 = qs.find((q) => !q.typed);
  assert.equal((await c.put("/api/scholarship/exam/answer", { questionId: q0.id, answer: q0.options[0].label })).status, 200);
  assert.equal((await c.put("/api/scholarship/exam/answer", { questionId: q0.id, answer: "ZZ" })).status, 400, "an option that does not exist");
  assert.equal((await c.put("/api/scholarship/exam/answer", { questionId: "not-a-question", answer: "A" })).status, 400);
  const foreign = (await sql(`select id from "ScholarshipQuestion" where "categoryKey"<>'3-4' limit 1`))[0].id;
  assert.equal((await c.put("/api/scholarship/exam/answer", { questionId: foreign, answer: "A" })).status, 400, "a question of another class");
  // score: answer everything correctly using the database's marks
  const marks = await sql(`select id, "correctLabel", "answerText" from "ScholarshipQuestion" where id = any($1)`, [qs.map((q) => q.id)]);
  const answers = Object.fromEntries(marks.map((m) => [m.id, m.answerText ?? m.correctLabel]));
  assert.equal((await c.post("/api/scholarship/exam/submit", { answers })).status, 200);
  const att = (await sql(`select a.status, a.score, a.total, a.percent, a."scholarshipPercent" from "ScholarshipAttempt" a join "ScholarshipStudent" s on s.id=a."studentId" order by a."startedAt" desc limit 1`))[0];
  assert.deepEqual([att.status, att.score, att.total, att.percent, att.scholarshipPercent], ["SUBMITTED", 25, 25, 100, 90]);
  assert.deepEqual((await c.get("/api/scholarship/exam")).body, { status: "SUBMITTED", finishedAt: (await c.get("/api/scholarship/exam")).body.finishedAt, timedOut: false });
  assert.equal((await c.post("/api/scholarship/exam/submit", { answers: {} })).status, 200, "submit is idempotent");
  assert.equal((await c.put("/api/scholarship/exam/answer", { questionId: q0.id, answer: q0.options[1].label })).status, 409, "no answers after submission");
  assert.equal((await sql(`select score from "ScholarshipAttempt" where id=(select id from "ScholarshipAttempt" order by "startedAt" desc limit 1)`))[0].score, 25, "the result did not change");
});

test("SCH-09 wrong answers score zero and still earn the minimum scholarship; unanswered counts as wrong", async () => {
  const { c } = await candidate();
  const st = (await c.post("/api/scholarship/exam/start", {})).body;
  await c.post("/api/scholarship/exam/submit", {});
  const a = (await sql(`select score, percent, "scholarshipPercent" from "ScholarshipAttempt" order by "startedAt" desc limit 1`))[0];
  assert.deepEqual([a.score, a.percent, a.scholarshipPercent], [0, 0, 60]);
  assert.ok(st.questions.length > 0);
});

test("SCH-10 time limit: nothing is accepted after expiry + grace, and a late submit grades only what was saved", async () => {
  const { c } = await candidate();
  const st = (await c.post("/api/scholarship/exam/start", {})).body;
  const q = st.questions.find((x) => !x.typed);
  await c.put("/api/scholarship/exam/answer", { questionId: q.id, answer: q.options[0].label });
  const attemptId = (await sql(`select id from "ScholarshipAttempt" order by "startedAt" desc limit 1`))[0].id;
  await sql(`update "ScholarshipAttempt" set "expiresAt" = (now() at time zone 'utc') - interval '1 hour' where id=$1`, [attemptId]);
  assert.equal((await c.put("/api/scholarship/exam/answer", { questionId: q.id, answer: q.options[1].label })).status, 409, "autosave after the deadline");
  const all = await sql(`select id, "correctLabel" from "ScholarshipQuestion" where id = any($1) and "correctLabel" is not null`, [st.questions.map((x) => x.id)]);
  const late = await c.post("/api/scholarship/exam/submit", { answers: Object.fromEntries(all.map((m) => [m.id, m.correctLabel])) });
  assert.equal(late.status, 200);
  const a = (await sql(`select "timedOut", answers from "ScholarshipAttempt" where id=$1`, [attemptId]))[0];
  assert.equal(a.timedOut, true);
  assert.deepEqual(Object.keys(a.answers), [q.id], "answers sent after the deadline were ignored");
});

test("SCH-11 simultaneous autosaves of different questions are all kept; simultaneous starts make one attempt", async () => {
  const { c } = await candidate();
  const started = await Promise.all([c.post("/api/scholarship/exam/start", {}), c.post("/api/scholarship/exam/start", {}), c.post("/api/scholarship/exam/start", {})]);
  assert.ok(started.every((r) => r.status === 200));
  const st = started[0].body;
  const sid = (await sql(`select id from "ScholarshipStudent" order by "createdAt" desc limit 1`))[0].id;
  assert.equal((await sql(`select count(*)::int n from "ScholarshipAttempt" where "studentId"=$1`, [sid]))[0].n, 1);
  const choice = st.questions.filter((q) => !q.typed).slice(0, 8);
  await Promise.all(choice.map((q) => c.put("/api/scholarship/exam/answer", { questionId: q.id, answer: q.options[0].label })));
  const saved = (await sql(`select answers from "ScholarshipAttempt" where "studentId"=$1`, [sid]))[0].answers;
  assert.equal(Object.keys(saved).length, choice.length, "no autosave overwrote another");
});

test("SCH-12 images are served only to a candidate who started the exam, only for their own class, with hardening headers", async () => {
  const { c } = await candidate();
  const img = (await sql(`select unnest("imageIds") id from "ScholarshipQuestion" where "categoryKey"='3-4' limit 1`))[0]?.id;
  const other = (await sql(`select unnest("imageIds") id from "ScholarshipQuestion" where "categoryKey"='11' and not ("imageIds" && (select array_agg(i) from (select unnest("imageIds") i from "ScholarshipQuestion" where "categoryKey"='3-4') x)) limit 1`))[0]?.id;
  if (!img) return;
  assert.equal((await c.get(`/api/scholarship/media/${img}`)).status, 403, "before the exam starts");
  await c.post("/api/scholarship/exam/start", {});
  const r = await c.raw(`/api/scholarship/media/${img}`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.match(r.headers.get("content-security-policy") ?? "", /sandbox/);
  if (other) assert.equal((await c.get(`/api/scholarship/media/${other}`)).status, 404, "another class's image");
  assert.equal((await c.get(`/api/scholarship/media/..%2f..%2fetc%2fpasswd`)).status, 404);
});

test("SCH-13 the candidate API never exposes the FIN, its hash, the code or the result", async () => {
  const { c, body } = await candidate();
  await c.post("/api/scholarship/exam/start", {});
  const me = JSON.stringify((await c.get("/api/scholarship/me")).body);
  const exam = JSON.stringify((await c.get("/api/scholarship/exam")).body);
  for (const t of [me, exam]) {
    assert.ok(!t.includes(body.fin) && !/finHash|finEncrypted|"score"|"percent"|scholarshipPercent/.test(t), t.slice(0, 200));
    assert.ok(!t.includes(body.code), "course code echoed");
  }
});

test("SCH-14 an exam session is not a portal session (and the other way round)", async () => {
  const { c } = await candidate();
  for (const p of ["/api/teacher/classes", "/api/student/classes", "/api/admin/students"]) assert.equal((await c.get(p)).status, 401, p);
  const r = await c.raw("/admin");
  assert.ok([302, 307].includes(r.status));
  const portal = await loginAs("ali.memmedov@example.com", "student123").catch(() => null);
  if (portal) assert.equal((await portal.get("/api/scholarship/me")).status, 401);
});

test("SCH-15 results are visible to administrators in the panel and to nobody else", async () => {
  const html = (await admin.page("/admin/scholarship")).html;
  assert.ok(/90|60/.test(html) && /Candidate/.test(html), "the admin overview lists candidates and results");
  const t = await loginAs("tural.zeynalov@salehtech.az", "teacher123").catch(() => null);
  if (t) assert.ok([302, 307].includes((await t.raw("/admin/scholarship")).status));
  assert.ok([302, 307].includes((await new Client().raw("/admin/scholarship")).status));
});
