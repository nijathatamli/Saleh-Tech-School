// Creates (or resets the password of) an ADMIN login for the dashboard at /giris.
// Credentials come from the environment so they never end up in the repo or shell history files:
//
//   ADMIN_EMAIL=… ADMIN_PASSWORD=… [ADMIN_NAME=…] node scripts/create-admin.mjs
//
// Uses DATABASE_URL (from .env or the environment), so the same script works locally and on Render.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import pg from "pg";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || email?.split("@")[0] || "Admin";
const url = process.env.DATABASE_URL;
if (!email || !password || !url) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (and DATABASE_URL).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: /render\.com|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await client.query(
    `INSERT INTO "User" ("id","name","email","passwordHash","role","updatedAt")
     VALUES ($1,$2,$3,$4,'ADMIN',CURRENT_TIMESTAMP)
     ON CONFLICT ("email") DO UPDATE SET "passwordHash"=$4,"role"='ADMIN',"name"=$2,"updatedAt"=CURRENT_TIMESTAMP
     RETURNING "email","role"`,
    [randomUUID(), name, email, hash],
  );
  console.log(`admin ready: ${rows[0].email} (${rows[0].role})`);
} finally {
  await client.end();
}
