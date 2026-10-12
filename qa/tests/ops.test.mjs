// Operational safeguards: the default-password audit tool and the seed guard.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import bcrypt from "bcryptjs";
import path from "node:path";
import { Client, DB_URL, sql, tag } from "./helpers.mjs";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const env = { ...process.env, DATABASE_URL: DB_URL };
const run = (args) => spawnSync("node", ["scripts/audit-default-passwords.mjs", ...args], { cwd: ROOT, env, encoding: "utf8" });

async function makeUser(email, password, role = "PARENT") {
  await sql(`insert into "User" (id,name,email,"passwordHash",role,"updatedAt") values ($1,$2,$3,$4,$5::"Role",now())`, [`qa_def_${tag()}${tag()}`, `QA Default ${email}`, email, await bcrypt.hash(password, 10), role]);
}

test("OPS-02 the audit tool reports accounts that use a published demo password without changing anything", async () => {
  const t = tag();
  await makeUser(`qa.default.a.${t}@qa.test`, "admin123");
  await makeUser(`qa.default.b.${t}@qa.test`, "parent123");
  await makeUser(`qa.strong.${t}@qa.test`, "xK9#mP2$vL7qZ-strong");
  const r = run([`--emails=qa.default.a.${t}@qa.test,qa.default.b.${t}@qa.test,qa.strong.${t}@qa.test`]);
  assert.equal(r.status, 1, "exit code 1 while flagged accounts exist (usable as a deploy gate)");
  assert.match(r.stderr, new RegExp(`qa\\.default\\.a\\.${t}@qa\\.test`));
  assert.match(r.stderr, new RegExp(`qa\\.default\\.b\\.${t}@qa\\.test`));
  assert.ok(!r.stderr.includes(`qa.strong.${t}`), "a strong password is not flagged");
  assert.ok(!/admin123|parent123/.test(r.stdout + r.stderr.replace(/using a known\/default password/, "")), "the guessed password is never printed");
  assert.equal(await new Client().login(`qa.default.a.${t}@qa.test`, "admin123"), true, "report mode changed nothing");
});

test("OPS-03 --rotate gives only the selected accounts a new random password and prints it once", async () => {
  const t = tag();
  const a = `qa.rot.a.${t}@qa.test`, b = `qa.rot.b.${t}@qa.test`;
  await makeUser(a, "teacher123", "TEACHER");
  await makeUser(b, "student123", "STUDENT");
  const r = run(["--rotate", `--emails=${a}`]);
  const line = r.stdout.trim().split("\n").find((l) => l.startsWith(a));
  assert.ok(line, `no password line for ${a}: ${r.stdout} ${r.stderr}`);
  const newPw = line.split(",")[2];
  assert.match(newPw, /^[A-Za-z0-9]{16}$/);
  assert.equal(await new Client().login(a, "teacher123"), false, "the old password stopped working");
  assert.equal(await new Client().login(a, newPw), true, "the printed password works");
  assert.equal(await new Client().login(b, "student123"), true, "an account that was not selected is untouched");
  assert.ok(!r.stdout.includes(b));
});

test("OPS-04 --deactivate locks flagged accounts instead", async () => {
  const t = tag();
  const e = `qa.lock.${t}@qa.test`;
  await makeUser(e, "password");
  run(["--deactivate", `--emails=${e}`]);
  assert.equal((await sql(`select active from "User" where email=$1`, [e]))[0].active, false);
  assert.equal(await new Client().login(e, "password"), false);
});

test("OPS-05 the seed refuses to run against a non-local database", () => {
  const r = spawnSync("npx", ["tsx", "prisma/seed.ts"], { cwd: ROOT, env: { ...process.env, DATABASE_URL: "postgresql://u:p@db.example.com:5432/x" }, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /Refusing to seed a non-local database/);
});
