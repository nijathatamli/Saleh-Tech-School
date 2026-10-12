// Shared helpers for the QA suites. They only talk to the QA app (default http://127.0.0.1:3100) and the
// isolated QA database (default 127.0.0.1:5434). They refuse any other target.
import assert from "node:assert/strict";
import pg from "pg";

export const BASE = process.env.QA_BASE_URL ?? "http://127.0.0.1:3100";
export const DB_URL = process.env.QA_DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5434/postgres";
assert.ok(/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE), `QA_BASE_URL must be local, got ${BASE}`);
assert.ok(/@(127\.0\.0\.1|localhost)[:/]/.test(DB_URL) && !/:5433\//.test(DB_URL), "QA_DATABASE_URL must be the isolated local QA database (not the dev DB on :5433)");

/** One short-lived connection per query; retries only on connection-level trouble (SQL errors are real and are thrown). */
export async function sql(text, params = []) {
  let last;
  for (let i = 0; i < 40; i++) {
    const c = new pg.Client({ connectionString: DB_URL });
    try {
      await c.connect();
      const r = await c.query(text, params);
      await c.end();
      return r.rows;
    } catch (e) {
      last = e;
      try { await c.end(); } catch {}
      const transient = !e.code || /^E[A-Z]+$/.test(e.code) || /^(08|57P|53)/.test(e.code); // connection trouble only; SQL errors are real
      if (!transient) throw e;
      await new Promise((r) => setTimeout(r, 150 + i * 30));
    }
  }
  throw last;
}

/** Minimal fetch client with a cookie jar. */
export class Client {
  constructor(label = "anon", ip) {
    this.label = label; this.jar = new Map();
    // every client is its own "visitor": sign-in throttling is keyed by address and all QA traffic comes from 127.0.0.1
    this.ip = ip ?? `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${1 + Math.floor(Math.random() * 250)}`;
  }
  #absorb(res) {
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      const [pair, ...attrs] = sc.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i).trim(); const value = pair.slice(i + 1).trim();
      const expired = attrs.some((a) => /^\s*max-age=0/i.test(a)) || value === "";
      if (expired) this.jar.delete(name); else this.jar.set(name, value);
      this.lastSetCookie = [...(this.lastSetCookie ?? []), sc];
    }
  }
  cookieHeader() { return [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "); }
  async raw(path, { method = "GET", headers = {}, body, redirect = "manual" } = {}) {
    const res = await fetch(BASE + path, { method, redirect, headers: { "x-forwarded-for": this.ip, ...(this.jar.size ? { cookie: this.cookieHeader() } : {}), ...headers }, body });
    this.#absorb(res);
    return res;
  }
  async json(path, method = "GET", data, extraHeaders = {}) {
    const res = await this.raw(path, { method, headers: { ...(data !== undefined ? { "content-type": "application/json" } : {}), ...extraHeaders }, body: data !== undefined ? JSON.stringify(data) : undefined });
    const text = await res.text();
    let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: res.status, body, headers: res.headers };
  }
  get(p, h) { return this.json(p, "GET", undefined, h); }
  post(p, d, h) { return this.json(p, "POST", d, h); }
  patch(p, d, h) { return this.json(p, "PATCH", d, h); }
  put(p, d, h) { return this.json(p, "PUT", d, h); }
  del(p, h) { return this.json(p, "DELETE", undefined, h); }
  async page(path) { const res = await this.raw(path); return { status: res.status, location: res.headers.get("location"), html: res.status < 300 || res.status >= 400 ? await res.text() : await res.text() }; }

  /** NextAuth credentials sign-in. Returns true when a session cookie was issued. */
  async login(email, password) {
    const csrf = await (await this.raw("/api/auth/csrf")).json();
    const res = await this.raw("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ csrfToken: csrf.csrfToken, email, password, callbackUrl: BASE + "/", json: "true" }),
    });
    await res.text();
    const sess = await (await this.raw("/api/auth/session")).json();
    this.user = sess?.user ?? null;
    return !!this.user;
  }
}

export async function loginAs(email, password, label) {
  const c = new Client(label ?? email);
  assert.equal(await c.login(email, password), true, `login failed for ${email}`);
  return c;
}

export const ADMIN = { email: "admin@salehtech.az", password: "admin123" };

export const tag = () => Array.from({ length: 6 }, () => "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]).join(""); // letters only: student names reject digits

/**
 * Synthetic, traceable fixtures created through the real admin API (so every test also exercises the admin workflows):
 * two teachers, two parents, three students (two siblings under parent 1), one class each for teachers A and B.
 */
export async function makeWorld(admin, t = tag()) {
  const pw = "Passw0rd!x";
  const must = (r, what) => { assert.ok(r.status >= 200 && r.status < 300, `${what} -> ${r.status} ${JSON.stringify(r.body)}`); return r.body; };
  const courses = must(await admin.get("/api/admin/courses?size=50"), "courses");
  const course = (courses.items ?? courses).find((c) => c.active !== false) ?? (courses.items ?? courses)[0];
  const mkTeacher = async (n) => must(await admin.post("/api/admin/teachers", { name: `QA Teacher ${n} ${t}`, email: `qa.t${n}.${t}@qa.test`, password: pw, position: "QA Müəllim" }), `teacher ${n}`);
  const mkParent = async (n) => must(await admin.post("/api/admin/parents", { name: `QA Parent ${n} ${t}`, email: `qa.p${n}.${t}@qa.test`, password: pw }), `parent ${n}`);
  const [tA, tB, p1, p2] = [await mkTeacher("A"), await mkTeacher("B"), await mkParent("1"), await mkParent("2")];
  const mkStudent = async (n, parent) => must(await admin.post("/api/admin/students", { firstName: `Qa${n}`, lastName: `Student${t}`, email: `qa.s${n}.${t}@qa.test`, password: pw, birthDate: "2014-05-05", grade: 5, parentId: parent.id }), `student ${n}`);
  const [s1, s2, s3] = [await mkStudent("one", p1), await mkStudent("two", p2), await mkStudent("three", p1)];
  const mkClass = async (n, teacher, students) => must(await admin.post("/api/admin/classes", { name: `QA Class ${n} ${t}`, courseId: course.id, teacherId: teacher.id, studentIds: students.map((s) => s.id), lessonsPerCycle: 8 }), `class ${n}`);
  const cA = await mkClass("A", tA, [s1, s3]);
  const cB = await mkClass("B", tB, [s2]);
  return {
    tag: t, pw, course,
    teacherA: { ...tA, email: `qa.tA.${t}@qa.test` }, teacherB: { ...tB, email: `qa.tB.${t}@qa.test` },
    parent1: { ...p1, email: `qa.p1.${t}@qa.test` }, parent2: { ...p2, email: `qa.p2.${t}@qa.test` },
    student1: { ...s1, email: `qa.sone.${t}@qa.test` }, student2: { ...s2, email: `qa.stwo.${t}@qa.test` }, student3: { ...s3, email: `qa.sthree.${t}@qa.test` },
    classA: cA, classB: cB,
  };
}

/** School-time "YYYY-MM-DDTHH:mm" helper, `daysAgo` negative = future. */
export function slot(daysAgo, hour = 10, minute = 0) {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Baku" }).format(d);
  return `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------------------------------------------
// Server actions over real HTTP. Next hashes action ids at build time; they are recovered from the built page chunk
// (`<id>:()=>…then(e=>e.<exportName>)`). Requires a production build in ./.next (npx next build).
import fs from "node:fs";
import path from "node:path";
const actionCache = new Map();
export function actionId(pageDir, name) {
  const file = path.resolve(import.meta.dirname, "..", "..", ".next", "server", "app", pageDir, "page.js");
  if (!actionCache.has(file)) {
    const src = fs.readFileSync(file, "utf8");
    const map = new Map();
    for (const m of src.matchAll(/"?([0-9a-f]{40})"?:\(\)=>Promise\.resolve\(\)\.then\(\w+\.bind\(\w+,\d+\)\)\.then\(\w+=>\w+\.(\w+)\)/g)) map.set(m[2], m[1]);
    actionCache.set(file, map);
  }
  const id = actionCache.get(file).get(name);
  assert.ok(id, `server action ${name} not found in ${pageDir}`);
  return id;
}

/** Calls a server action as `client`. `pageDir` = the app route folder that bundles it (e.g. "teacher/[[...slug]]"), `route` = a URL of that page. */
export async function callAction(client, { pageDir, route }, name, args) {
  const res = await client.raw(route, {
    method: "POST",
    headers: { "next-action": actionId(pageDir, name), accept: "text/x-component", "content-type": "text/plain;charset=UTF-8", origin: BASE, host: new URL(BASE).host },
    body: JSON.stringify(args),
    redirect: "manual",
  });
  const text = await res.text();
  const line = text.split("\n").find((l) => /^1:/.test(l));
  let value; try { value = line ? JSON.parse(line.slice(2)) : undefined; } catch { value = line; }
  return { status: res.status, value, text };
}
export const TEACHER_ACTIONS = { pageDir: "teacher/[[...slug]]", route: "/teacher" };
export const STUDENT_ACTIONS = { pageDir: "student/[[...slug]]", route: "/student" };
export const PARENT_ACTIONS = { pageDir: "parent/[[...slug]]", route: "/parent" };
