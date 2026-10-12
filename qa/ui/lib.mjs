// Shared Playwright helpers for the UI audit. Runs against the QA app (production build) and the isolated QA database.
import fs from "node:fs";
import { chromium } from "playwright";
import { BASE, sql } from "../tests/helpers.mjs";

export { BASE, sql };
export const VIEWPORTS = { desktop: { width: 1366, height: 900 }, mobile: { width: 390, height: 844 } };
export const ACCOUNTS = {
  admin: { email: "admin@salehtech.az", password: "admin123", home: "/admin" },
  teacher: { email: process.env.QA_TEACHER_EMAIL ?? "tural.zeynalov@salehtech.az", password: "teacher123", home: "/teacher" },
  student: { email: "ali.memmedov@example.com", password: "student123", home: "/student" },
  parent: { email: "elvin.memmedov@example.com", password: "parent123", home: "/parent" },
};

export async function launch() { return chromium.launch(); }

/** Signs in through the real login form (so the form itself is exercised). */
export async function loginViaUi(page, role) {
  const a = ACCOUNTS[role];
  await page.goto(BASE + "/giris", { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', a.email);
  await page.fill('input[type="password"]', a.password);
  await Promise.all([page.waitForURL(new RegExp(`${a.home}(/|$|\\?)`), { timeout: 30_000 }), page.click('button[type="submit"]')]);
}

/** Attaches collectors for console errors, page errors, failed requests and 4xx/5xx responses. */
export function watch(page) {
  const log = { console: [], pageerrors: [], failed: [], bad: [], requests: [] };
  page.on("console", (m) => { if (m.type() === "error") log.console.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => log.pageerrors.push(String(e).slice(0, 300)));
  page.on("requestfailed", (r) => { if (!/_rsc=|favicon|\/_next\/image/.test(r.url()) && r.failure()?.errorText !== "net::ERR_ABORTED") log.failed.push(`${r.method()} ${r.url().replace(BASE, "")} ${r.failure()?.errorText}`); });
  page.on("response", (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) log.bad.push(`${r.status()} ${r.request().method()} ${r.url().replace(BASE, "")}`); });
  page.on("request", (r) => { if (!/\/_next\/(static|image)|favicon|_rsc=/.test(r.url())) log.requests.push(`${r.method()} ${r.url().replace(BASE, "").slice(0, 120)}`); });
  return { log, reset: () => { for (const k of Object.keys(log)) log[k].length = 0; } };
}

/** Every route of every panel, with ids resolved from the seeded QA database. */
export async function routes() {
  const one = async (q) => (await sql(q))[0] ?? { id: null };
  const cls = await one(`select c.id from "ClassGroup" c join "TeacherProfile" t on t.id=c."teacherId" join "User" u on u.id=t."userId" where u.email='${ACCOUNTS.teacher.email}' and c.status='ACTIVE' limit 1`);
  const les = await one(`select l.id from "Lesson" l join "ClassGroup" c on c.id=l."classId" join "TeacherProfile" t on t.id=c."teacherId" join "User" u on u.id=t."userId" where u.email='${ACCOUNTS.teacher.email}' order by l.date desc limit 1`);
  const hw = await one(`select h.id from "Homework" h join "Lesson" l on l.id=h."lessonId" join "ClassGroup" c on c.id=l."classId" join "TeacherProfile" t on t.id=c."teacherId" join "User" u on u.id=t."userId" where u.email='${ACCOUNTS.teacher.email}' limit 1`);
  const stu = await one(`select s.id from "StudentProfile" s join "Enrollment" e on e."studentId"=s.id join "ClassGroup" c on c.id=e."classId" join "TeacherProfile" t on t.id=c."teacherId" join "User" u on u.id=t."userId" where u.email='${ACCOUNTS.teacher.email}' limit 1`);
  const teacher = await one(`select id from "TeacherProfile" limit 1`);
  const parent = await one(`select pp.id from "ParentProfile" pp join "User" u on u.id=pp."userId" where u.email='elvin.memmedov@example.com'`);
  const adminStudent = await one(`select id from "StudentProfile" order by "createdAt" limit 1`);
  const adminClass = await one(`select id from "ClassGroup" order by "createdAt" limit 1`);
  const landingTeacherId = JSON.parse(fs.readFileSync(new URL("../../src/lib/public-content.json", import.meta.url), "utf8")).teachers[0].id;
  return {
    public: ["/", "/kurslar", "/kurslar/kibertehlukesizlik", "/muellimler", `/muellimler/${landingTeacherId}`, "/sinaq-dersi", "/teqaud", "/teqaud/hazirliq", "/teqaud/qeydiyyat", "/giris", "/sifre-unutdum"],
    admin: ["/admin", "/admin/students", `/admin/students/${adminStudent.id}`, "/admin/teachers", `/admin/teachers/${teacher.id}`, "/admin/parents", `/admin/parents/${parent.id}`, "/admin/classes", `/admin/classes/${adminClass.id}`, "/admin/courses", "/admin/schedule", "/admin/attendance", "/admin/payments", "/admin/leads", "/admin/scholarship", "/admin/reports", "/admin/notifications", "/admin/audit", "/admin/settings"],
    teacher: ["/teacher", "/teacher/classes", cls.id && `/teacher/classes/${cls.id}`, cls.id && les.id && `/teacher/classes/${cls.id}/attendance?lesson=${les.id}`, "/teacher/students", stu.id && `/teacher/students/${stu.id}`, "/teacher/homework", "/teacher/homework/new", hw.id && `/teacher/homework/${hw.id}/grade`, "/teacher/profile"].filter(Boolean),
    student: ["/student", "/student/progress", "/student/attendance", "/student/homework", "/student/portfolio", "/student/leaderboard", "/student/settings"],
    parent: ["/parent", "/parent/children", "/parent/attendance", "/parent/homework", "/parent/notifications", "/parent/settings"],
  };
}
