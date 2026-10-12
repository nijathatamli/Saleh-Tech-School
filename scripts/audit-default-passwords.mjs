// Finds accounts that still use one of the demo passwords published in prisma/seed.ts (and a few other common ones).
// Those accounts can be opened by anybody who has read the repository. Passwords are checked OFFLINE against the stored
// bcrypt hashes — nothing is sent over the login form, nothing is printed except e-mail, role and a verdict.
//
//   DATABASE_URL=… node scripts/audit-default-passwords.mjs                      # report only (default, changes nothing)
//   DATABASE_URL=… node scripts/audit-default-passwords.mjs --rotate             # give every flagged account a new random password
//   DATABASE_URL=… node scripts/audit-default-passwords.mjs --deactivate         # or lock them instead (active=false)
//   … --emails a@x.az,b@y.az                                                      # limit --rotate/--deactivate to these accounts
//
// --rotate prints "email,role,newPassword" ONCE to stdout (redirect to a file you then store safely, then hand the
// passwords to their owners and delete the file). Exit code 1 when flagged accounts remain, so it can gate a deploy.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) { console.error("Set DATABASE_URL."); process.exit(2); }
const args = process.argv.slice(2);
const rotate = args.includes("--rotate"), deactivate = args.includes("--deactivate");
const only = (args.find((a) => a.startsWith("--emails="))?.slice(9) ?? (args.includes("--emails") ? args[args.indexOf("--emails") + 1] : "")).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

const KNOWN = ["admin123", "teacher123", "parent123", "student123", "password", "Password1", "12345678", "123456789", "qwerty123", "admin", "salehtech", "Saleh123", "saleh123"];
const client = new pg.Client({ connectionString: url, ssl: /render\.com|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  const all = (await client.query(`SELECT "id","email","role","active","passwordHash" FROM "User" ORDER BY "role","email"`)).rows;
  const rows = only.length ? all.filter((u) => only.includes(u.email.toLowerCase())) : all; // --emails also limits what is checked (bcrypt is deliberately slow)
  const flagged = rows.filter((u) => KNOWN.some((g) => bcrypt.compareSync(g, u.passwordHash)));
  console.error(`accounts checked: ${rows.length}; using a known/default password: ${flagged.length}`);
  for (const u of flagged) console.error(`  ${u.role.padEnd(8)} ${u.email}${u.active ? "" : "  (already inactive)"}`);
  const targets = flagged.filter((u) => u.active && (only.length === 0 || only.includes(u.email.toLowerCase())));
  if (rotate && deactivate) { console.error("choose either --rotate or --deactivate"); process.exit(2); }
  if (rotate) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    for (const u of targets) {
      const pw = Array.from(randomBytes(16), (b) => alphabet[b % alphabet.length]).join("");
      await client.query(`UPDATE "User" SET "passwordHash"=$1, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$2`, [await bcrypt.hash(pw, 10), u.id]);
      console.log(`${u.email},${u.role},${pw}`);
    }
    console.error(`rotated ${targets.length} account(s)`);
  } else if (deactivate) {
    for (const u of targets) await client.query(`UPDATE "User" SET "active"=false, "updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1`, [u.id]);
    console.error(`deactivated ${targets.length} account(s)`);
  } else if (flagged.length) console.error("report only — nothing changed. Re-run with --rotate or --deactivate.");
  const fresh = (await client.query(`SELECT "email","active","passwordHash" FROM "User"`)).rows.filter((u) => only.length === 0 || only.includes(u.email.toLowerCase()));
  const left = fresh.filter((u) => u.active && KNOWN.some((g) => bcrypt.compareSync(g, u.passwordHash))).length;
  process.exitCode = left ? 1 : 0;
} finally {
  await client.end();
}
