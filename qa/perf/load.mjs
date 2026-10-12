// Controlled load/latency measurement against the QA app (production build) and the isolated QA database.
// Reports latency percentiles and error rates for representative authenticated requests at several concurrency levels.
// This is a LOCAL measurement on one machine (app + database + load generator share it): use it to compare, to find
// slow endpoints and to detect errors under parallelism — not as a capacity promise for the hosting plan.
//   node qa/perf/load.mjs [--seconds 8] [--out file.json]
import fs from "node:fs";
import { Client, ADMIN, loginAs, makeWorld, sql, slot } from "../tests/helpers.mjs";

const arg = (n, d) => (process.argv.includes(n) ? process.argv[process.argv.indexOf(n) + 1] : d);
const SECONDS = Number(arg("--seconds", 8));
const OUT = arg("--out", null);

const admin = await loginAs(ADMIN.email, ADMIN.password);
const w = await makeWorld(admin);
const [tA, s1, p1] = await Promise.all([w.teacherA, w.student1, w.parent1].map((u) => loginAs(u.email, w.pw)));
for (let i = 0; i < 3; i++) await tA.post(`/api/teacher/classes/${w.classA.id}/lessons`, { date: slot(10 + i, 10) });

const targets = [
  ["public  GET /", () => new Client().raw("/")],
  ["public  GET /kurslar", () => new Client().raw("/kurslar")],
  ["public  GET /api/health", () => new Client().raw("/api/health")],
  ["admin   GET /admin", () => admin.raw("/admin")],
  ["admin   GET /admin/students", () => admin.raw("/admin/students")],
  ["admin   GET /admin/reports", () => admin.raw("/admin/reports")],
  ["admin   GET /api/admin/classes", () => admin.get("/api/admin/classes")],
  ["admin   GET /api/admin/students?size=100", () => admin.get("/api/admin/students?size=100")],
  ["teacher GET /teacher", () => tA.raw("/teacher")],
  ["teacher GET /api/teacher/classes", () => tA.get("/api/teacher/classes")],
  ["student GET /student", () => s1.raw("/student")],
  ["parent  GET /parent", () => p1.raw("/parent")],
];

const pct = (a, p) => a.length ? a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))] : 0;
const results = [];
for (const [label, fn] of targets) {
  for (const conc of [1, 5, 20]) {
    const lat = []; let errors = 0, total = 0; const end = Date.now() + SECONDS * 1000 / 2;
    await Promise.all(Array.from({ length: conc }, async () => {
      while (Date.now() < end) {
        const t0 = performance.now();
        try { const r = await fn(); if (r.status >= 500 || (r.text && r.status >= 400)) errors++; else if (r.body && typeof r.body.arrayBuffer === "function") await r.arrayBuffer?.().catch(() => {}); if (r.status >= 500) errors++; } catch { errors++; }
        lat.push(performance.now() - t0); total++;
      }
    }));
    lat.sort((a, b) => a - b);
    results.push({ label, conc, requests: total, rps: +(total / (SECONDS / 2)).toFixed(1), p50: +pct(lat, 50).toFixed(0), p95: +pct(lat, 95).toFixed(0), max: +lat[lat.length - 1].toFixed(0), errors });
  }
}
console.log("endpoint".padEnd(44), "conc".padStart(4), "req".padStart(5), "rps".padStart(6), "p50ms".padStart(6), "p95ms".padStart(6), "max".padStart(6), "err".padStart(4));
for (const r of results) console.log(r.label.padEnd(44), String(r.conc).padStart(4), String(r.requests).padStart(5), String(r.rps).padStart(6), String(r.p50).padStart(6), String(r.p95).padStart(6), String(r.max).padStart(6), String(r.errors).padStart(4));
if (OUT) fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
