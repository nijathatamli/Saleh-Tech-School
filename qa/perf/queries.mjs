// Counts SQL statements per page/API request using the QA PostgreSQL server log (log_statement=all). Flags N+1 patterns.
//   node qa/perf/queries.mjs <pgdata-dir>
import fs from "node:fs";
import { Client, ADMIN, loginAs, makeWorld } from "../tests/helpers.mjs";
const logFile = (dir) => { const f = fs.readdirSync(dir).filter((n) => n === "server.log"); return `${dir}/${f[0]}`; };
const lf = logFile(process.argv[2]);
const admin = await loginAs(ADMIN.email, ADMIN.password);
const [tN, pE, sA] = [await loginAs("tural.zeynalov@salehtech.az", "teacher123"), await loginAs("elvin.memmedov@example.com", "parent123"), await loginAs("ali.memmedov@example.com", "student123")];
const cls = (await admin.get("/api/admin/classes")).body.items[0];
const stu = (await admin.get("/api/admin/students")).body.items[0];
const probes = [
  ["admin /admin", admin, "/admin"], ["admin /admin/students", admin, "/admin/students"], [`admin /admin/students/:id`, admin, `/admin/students/${stu.id}`], ["admin /admin/classes", admin, "/admin/classes"],
  [`admin /admin/classes/:id`, admin, `/admin/classes/${cls.id}`], ["admin /admin/schedule", admin, "/admin/schedule"], ["admin /admin/attendance", admin, "/admin/attendance"], ["admin /admin/payments", admin, "/admin/payments"],
  ["admin /admin/reports", admin, "/admin/reports"], ["admin /admin/parents", admin, "/admin/parents"], ["admin /admin/teachers", admin, "/admin/teachers"], ["admin /admin/leads", admin, "/admin/leads"],
  ["teacher /teacher", tN, "/teacher"], ["teacher /teacher/classes", tN, "/teacher/classes"], ["student /student", sA, "/student"], ["parent /parent", pE, "/parent"],
  ["public /", new Client(), "/"], ["public /kurslar", new Client(), "/kurslar"],
];
const size = () => fs.statSync(lf).size;
const rows = [];
for (const [label, c, path] of probes) {
  await c.raw(path); // warm
  await new Promise((r) => setTimeout(r, 300));
  const from = size();
  await c.raw(path);
  await new Promise((r) => setTimeout(r, 400));
  const buf = Buffer.alloc(size() - from); const fd = fs.openSync(lf, "r"); fs.readSync(fd, buf, 0, buf.length, from); fs.closeSync(fd);
  const lines = buf.toString().split("\n").filter((l) => /LOG:\s+(execute [^:]*|statement):/.test(l) && !/SELECT 1|set_config|BEGIN|COMMIT|ROLLBACK/.test(l));
  const norm = lines.map((l) => l.replace(/^.*?(execute [^:]*|statement):\s*/, "").replace(/\$\d+|'[^']*'|\b\d+\b/g, "?").slice(0, 110));
  const top = Object.entries(norm.reduce((m, q) => ((m[q] = (m[q] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0];
  rows.push({ label, statements: lines.length, repeated: top && top[1] > 3 ? `${top[1]}× ${top[0]}` : "" });
}
console.log("request".padEnd(30), "SQL statements", " most repeated statement (>3)");
for (const r of rows) console.log(r.label.padEnd(30), String(r.statements).padStart(8), "      ", r.repeated);
