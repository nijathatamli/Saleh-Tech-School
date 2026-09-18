// Applies every SQL patch under prisma/patches (sorted by name, all idempotent)
// to DATABASE_URL. Runs at the start of `npm run build` so a Render deploy
// brings the database up to date before the new code serves traffic.
// Usage: node scripts/db-apply-patches.mjs
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("db-apply-patches: DATABASE_URL is not set, skipping");
  process.exit(0);
}
const dir = "prisma/patches";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const client = new pg.Client({ connectionString: url, ssl: /render\.com|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  for (const f of files) {
    await client.query(readFileSync(join(dir, f), "utf8"));
    console.log(`db-apply-patches: applied ${f}`);
  }
} finally {
  await client.end();
}
