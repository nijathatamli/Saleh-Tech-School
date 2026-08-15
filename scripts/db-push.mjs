// Applies prisma/init.sql directly to the local PGlite database, in-process.
// This avoids Prisma CLI's own connection layer entirely (which has a known
// incompatibility with PGlite's non-standard server_version banner).
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", ".pgdata");
const sqlPath = path.join(__dirname, "..", "prisma", "init.sql");

const sql = fs.readFileSync(sqlPath, "utf8");
const db = await PGlite.create({ dataDir });

console.log("Applying schema to", dataDir);
await db.exec(sql);
console.log("Schema applied successfully.");

await db.close();
