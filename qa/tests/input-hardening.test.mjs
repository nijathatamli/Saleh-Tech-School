// Found by fuzzing the panels: impossible dates were rolled over (30 Feb -> 2 Mar) or crashed with HTTP 500, a NUL byte in a
// search box and an absurd grade filter crashed every admin list with HTTP 500. They must be refused / ignored cleanly.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, loginAs, makeWorld, sql, callAction, slot, TEACHER_ACTIONS } from "./helpers.mjs";

let admin, w, tA;
before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
  tA = await loginAs(w.teacherA.email, w.pw);
});
const lessons = () => sql(`select count(*)::int n from "Lesson" where "classId"=$1`, [w.classA.id]).then((r) => r[0].n);

test("HARD-01 a lesson date that does not exist or is absurdly far away is refused with 422 (REST and dashboard action), never rolled over or crashed", async () => {
  const before = await lessons();
  for (const date of ["2026-02-30T10:00", "2026-10-18T25:61", "2026-13-01T10:00", "0001-01-01T00:00", "9999-12-31T23:59", "2100-01-01T10:00", "2000-01-01T10:00", "not-a-date", ""]) {
    const rest = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date });
    assert.ok(rest.status === 422 || rest.status === 400, `REST "${date}" -> ${rest.status} ${JSON.stringify(rest.body)}`);
    const act = await callAction(tA, TEACHER_ACTIONS, "createLesson", [{ classId: w.classA.id, date }]);
    assert.equal(act.value?.ok, false, `action "${date}" -> ${JSON.stringify(act.value)}`);
  }
  assert.equal(await lessons(), before, "no lesson was created by any of them");
  const ok = await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(3, 8) });
  assert.equal(ok.status, 201, "a valid date still works");
});

test("HARD-02 rescheduling to an impossible date is refused and leaves the lesson where it was", async () => {
  const l = (await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(9, 8) })).body.id;
  const was = (await sql(`select date from "Lesson" where id=$1`, [l]))[0].date.toISOString();
  for (const date of ["2026-02-30T10:00", "2026-10-18T99:99", "9999-12-31T10:00"]) {
    const r = await admin.patch(`/api/admin/lessons/${l}`, { date });
    assert.ok(r.status === 422 || r.status === 400, `"${date}" -> ${r.status} ${JSON.stringify(r.body)}`);
  }
  assert.equal((await sql(`select date from "Lesson" where id=$1`, [l]))[0].date.toISOString(), was);
});

const LISTS = ["students", "teachers", "parents", "classes", "courses", "applications", "payments"];

test("HARD-03 a NUL byte or control characters in a search box never crash a list (API and page)", async () => {
  for (const ep of LISTS) {
    for (const q of ["%00", "a%00b", "%1F%07", "%E0%A4%A"]) {
      const r = await admin.get(`/api/admin/${ep}?q=${q}`);
      assert.ok(r.status < 500, `/api/admin/${ep}?q=${q} -> ${r.status}`);
    }
    const page = ep === "applications" ? "leads" : ep;
    const p = await admin.page(`/admin/${page}?q=%00`);
    assert.ok(p.status < 500, `/admin/${page}?q=%00 -> ${p.status}`);
  }
  const hit = await admin.get(`/api/admin/students?q=${encodeURIComponent(w.student1.firstName)}`);
  assert.equal(hit.status, 200);
  assert.ok(JSON.stringify(hit.body).includes(w.student1.firstName), "a normal search still finds the student");
});

test("HARD-04 an absurd grade filter or an impossible/extreme date filter is ignored, not a crash", async () => {
  for (const q of ["grade=99999999999999", "grade=-3", "grade=abc", "grade=12"]) assert.equal((await admin.get(`/api/admin/students?${q}`)).status, 200, q);
  for (const ep of ["attendance", "lessons", "reports"]) {
    for (const q of ["from=2026-13-45", "to=2026-02-30", "from=0001-01-01&to=9999-12-31", "from=2026-10-01&to=2026-09-01"]) {
      const r = await admin.get(`/api/admin/${ep}?${q}`);
      assert.ok(r.status < 500, `/api/admin/${ep}?${q} -> ${r.status}`);
    }
  }
  for (const q of ["month=2026-13", "month=2026-00", "day=2026-02-30", "from=2026-13-45", "to=9999-12-31"]) assert.ok((await admin.page(`/admin/schedule?${q}`)).status < 500, q);
});

test("HARD-05 a picture uploaded while the server is running is served at once (a production `next start` does not serve files added to public/ after boot); odd names are 404", async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const form = new FormData();
  form.set("file", new Blob([png], { type: "image/png" }), "x.png");
  const up = await tA.raw("/api/uploads", { method: "POST", body: form });
  assert.equal(up.status, 200);
  const { url } = await up.json();
  assert.match(url, /^\/uploads\/[0-9a-f-]{36}\.png$/);
  const got = await tA.raw(url);
  assert.equal(got.status, 200, `GET ${url}`);
  assert.equal(got.headers.get("content-type"), "image/png");
  assert.equal(got.headers.get("x-content-type-options"), "nosniff");
  assert.equal(Buffer.compare(Buffer.from(await got.arrayBuffer()), png), 0, "the same bytes come back");
  for (const bad of ["/uploads/..%2f..%2fpackage.json", "/uploads/notes.txt", "/uploads/00000000-0000-0000-0000-000000000000.png", "/api/uploads/x.png", "/uploads/%2e%2e%2f.env"]) {
    assert.equal((await tA.raw(bad)).status, 404, bad);
  }
  assert.equal((await new (await import("./helpers.mjs")).Client("anon").raw("/api/uploads", { method: "POST", body: form })).status, 401, "anonymous upload refused");
});
