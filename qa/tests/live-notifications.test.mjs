// The feed behind the slide-in notification banners (every panel): /api/notifications/live.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { ADMIN, Client, loginAs, makeWorld, sql } from "./helpers.mjs";

let admin, w, teacher, student, parent, ids;
const uid = (email) => sql(`select id from "User" where lower(email)=lower($1)`, [email]).then((r) => r[0].id);
const mk = (userId, title, { read = false, ago = 0 } = {}) =>
  sql(`insert into "Notification"(id,"userId",title,body,type,read,"createdAt") values (gen_random_uuid()::text,$1,$2,'QA body','info',$3,(now() at time zone 'utc') - ($4 || ' seconds')::interval) returning id`, [userId, title, read, String(ago)]).then((r) => r[0].id);

before(async () => {
  admin = await loginAs(ADMIN.email, ADMIN.password, "admin");
  w = await makeWorld(admin);
  [teacher, student, parent] = await Promise.all([w.teacherA, w.student1, w.parent1].map((u) => loginAs(u.email, w.pw)));
  ids = { teacher: await uid(w.teacherA.email), student: await uid(w.student1.email), parent: await uid(w.parent1.email) };
});

test("LIVE-01 the feed needs a signed-in user", async () => {
  const anon = new Client("anon");
  assert.equal((await anon.get("/api/notifications/live")).status, 401);
});

test("LIVE-02 without a cursor it only hands out the cursor (nothing old is replayed), with a role and an unread count", async () => {
  await mk(ids.teacher, "QA old unread");
  const r = await teacher.get("/api/notifications/live");
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.items, []);
  assert.equal(r.body.role, "TEACHER");
  assert.ok(r.body.unread >= 1);
  assert.ok(!Number.isNaN(Date.parse(r.body.now)));
});

test("LIVE-03 after the cursor: only that user's new unread notifications, oldest first, never read ones or other people's", async () => {
  const cur = (await teacher.get("/api/notifications/live")).body.now;
  await new Promise((r) => setTimeout(r, 30));
  const a = await mk(ids.teacher, "QA first");
  const b = await mk(ids.teacher, "QA second");
  await mk(ids.teacher, "QA already read", { read: true });
  await mk(ids.student, "QA for the student");
  const r = await teacher.get(`/api/notifications/live?since=${encodeURIComponent(cur)}`);
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.items.map((n) => n.id), [a, b]);
  assert.deepEqual(r.body.items.map((n) => n.title), ["QA first", "QA second"]);
  // the next poll starts at the new cursor: nothing is delivered twice
  const again = await teacher.get(`/api/notifications/live?since=${encodeURIComponent(r.body.now)}`);
  assert.deepEqual(again.body.items, []);
  // a student and a parent see their own
  const s = await student.get(`/api/notifications/live?since=${encodeURIComponent(cur)}`);
  assert.deepEqual(s.body.items.map((n) => n.title), ["QA for the student"]);
  assert.equal(s.body.role, "STUDENT");
  assert.equal((await parent.get(`/api/notifications/live?since=${encodeURIComponent(cur)}`)).body.role, "PARENT");
});

test("LIVE-04 an old cursor does not flood: nothing older than ten minutes is announced, at most five at once; garbage cursors act like none", async () => {
  await mk(ids.parent, "QA stale", { ago: 3600 });
  for (let i = 0; i < 7; i++) await mk(ids.parent, `QA burst ${i}`, { ago: 5 });
  const r = await parent.get(`/api/notifications/live?since=${encodeURIComponent(new Date(Date.now() - 86_400_000).toISOString())}`);
  assert.ok(r.body.items.length <= 5);
  assert.ok(r.body.items.every((n) => n.title.startsWith("QA burst")), "the hour-old one is not announced");
  const junk = await parent.get("/api/notifications/live?since=not-a-date");
  assert.equal(junk.status, 200);
  assert.deepEqual(junk.body.items, []);
});

test("LIVE-05 an admin gets the same feed (the admin bell page is unchanged)", async () => {
  const r = await admin.get("/api/notifications/live");
  assert.equal(r.status, 200);
  assert.equal(r.body.role, "ADMIN");
});
