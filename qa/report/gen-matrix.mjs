// Generates the per-test table of docs/TEST_MATRIX.md from the JUnit files written by
//   node --test --test-reporter=junit --test-reporter-destination=.qa/junit-api.xml qa/tests/*.test.mjs
//   node --test --test-reporter=junit --test-reporter-destination=.qa/junit-ui.xml qa/ui/flows.test.mjs
// usage: node qa/report/gen-matrix.mjs > .qa/matrix-rows.md
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..", "..");
const ROLES = {
  "auth-security": "anonymous, all roles, operator", "rbac-idor": "anonymous, admin, teacher, student, parent", workflows: "admin, teacher, student, parent, visitor",
  billing: "admin, teacher, student, parent", "admin-crud": "admin (+ every role as the affected user)", "privacy-input": "student, teacher, parent, admin, visitor",
  scholarship: "exam candidate (public), admin", concurrency: "admin, teacher", "schema-drift": "— (database vs schema)", ops: "operator", flows: "per test (browser)",
};
const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'");
const rows = [];
for (const [xml, kind] of [[".qa/junit-api.xml", "API / integration"], [".qa/junit-ui.xml", "Browser (Playwright)"]]) {
  const text = fs.readFileSync(path.join(root, xml), "utf8");
  for (const m of text.matchAll(/<testcase name="([^"]*)"[^>]*file="([^"]*)"[^>]*?(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const name = unescape(m[1]); const file = m[2]; const body = m[4] ?? "";
    const id = name.split(" ")[0];
    const src = fs.readFileSync(file, "utf8");
    const idx = src.indexOf(`"${id} `); const line = idx < 0 ? "?" : src.slice(0, idx).split("\n").length;
    const suite = path.basename(file).replace(".test.mjs", "");
    const failed = /<failure/.test(body);
    const status = failed && /\(business decision\)/.test(name) ? "OPEN (needs a product decision)" : failed ? "FAIL" : "PASS";
    rows.push({ id, suite, kind, name: name.slice(id.length + 1), roles: ROLES[suite] ?? "", status, ev: `${path.relative(root, file)}:${line}` });
  }
}
const esc = (s) => s.replace(/\|/g, "\\|");
console.log("| Test ID | Layer | Role(s) | What is done and what is expected | Actual result | Status | Evidence |\n|---|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.id} | ${r.kind} | ${esc(r.roles)} | ${esc(r.name)} | ${r.status === "PASS" ? "as expected" : r.status.startsWith("OPEN") ? "behaviour differs from the recommended rule (see FINAL_RELEASE_AUDIT F-17)" : "see log"} | ${r.status} | \`${r.ev}\` |`);
console.error(`rows: ${rows.length}`);
