// Applies one SQL patch from prisma/patches to DATABASE_URL (local PGlite
// server or the Render Postgres). Usage:
//   node scripts/db-apply-patch.mjs prisma/patches/<file>.sql
//   DATABASE_URL="postgresql://…" node scripts/db-apply-patch.mjs prisma/patches/<file>.sql
import "dotenv/config";
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.error("usage: node scripts/db-apply-patch.mjs <patch.sql>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
const client = new pg.Client({ connectionString: url, ssl: /render\.com|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined });
await client.connect();
await client.query(readFileSync(file, "utf8"));
await client.end();
console.log(`applied ${file} to ${url.replace(/\/\/([^:]+):[^@]+@/, "//$1:***@")}`);
