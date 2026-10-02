// Loads the scholarship question bank (prisma/scholarship/questions.json + media/) into the
// database. Idempotent: categories/questions are upserted by their natural keys, media by
// content hash. Runs at the start of `npm run build` (after the SQL patches) so a deploy
// ships the questions together with the schema; run it by hand after re-parsing the DOCX:
//
//   node scripts/scholarship/parse-questions.mjs && node scripts/scholarship-sync.mjs
import "dotenv/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("scholarship-sync: DATABASE_URL is not set, skipping");
  process.exit(0);
}
const dir = "prisma/scholarship";
if (!existsSync(join(dir, "questions.json"))) {
  console.warn("scholarship-sync: prisma/scholarship/questions.json missing, skipping");
  process.exit(0);
}
const bank = JSON.parse(readFileSync(join(dir, "questions.json"), "utf8"));
const CONTENT_TYPE = { png: "image/png", svg: "image/svg+xml", jpg: "image/jpeg", jpeg: "image/jpeg" };

const client = new pg.Client({ connectionString: url, ssl: /render\.com|sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined });
await client.connect();
try {
  await client.query("BEGIN");

  for (const c of bank.categories) {
    await client.query(
      `INSERT INTO "ScholarshipCategory" ("key","label","gradeFrom","gradeTo","sortOrder","sourceFile")
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT ("key") DO UPDATE SET "label"=$2,"gradeFrom"=$3,"gradeTo"=$4,"sortOrder"=$5,"sourceFile"=$6`,
      [c.key, c.label, c.grades[0], c.grades[1], c.sortOrder, c.sourceFile],
    );
  }

  for (const [id, ext] of Object.entries(bank.media ?? {})) {
    const file = join(dir, "media", `${id}.${ext}`);
    await client.query(
      `INSERT INTO "ScholarshipMedia" ("id","contentType","data") VALUES ($1,$2,$3)
       ON CONFLICT ("id") DO UPDATE SET "contentType"=$2,"data"=$3`,
      [id, CONTENT_TYPE[ext] ?? "application/octet-stream", readFileSync(file)],
    );
  }

  const keep = [];
  for (const q of bank.questions) {
    const res = await client.query(
      `INSERT INTO "ScholarshipQuestion"
         ("id","categoryKey","subject","part","number","position","stem","options","imageIds","correctLabel","answerText","translations","updatedAt")
       VALUES ($1,$2,$3::"ScholarshipSubject",$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12::jsonb,CURRENT_TIMESTAMP)
       ON CONFLICT ("categoryKey","subject","part","number") DO UPDATE SET
         "position"=$6,"stem"=$7,"options"=$8::jsonb,"imageIds"=$9,"correctLabel"=$10,"answerText"=$11,"translations"=$12::jsonb,"updatedAt"=CURRENT_TIMESTAMP
       RETURNING "id"`,
      [randomUUID(), q.categoryKey, q.subject, q.part, q.number, q.order, q.stem, JSON.stringify(q.options), q.imageIds, q.answer ?? null, q.answerText ?? null, q.translations ? JSON.stringify(q.translations) : null],
    );
    keep.push(res.rows[0].id);
  }

  // Questions that disappeared from the bank are only removed while nobody has started an
  // exam: attempts freeze question ids, so deleting later would break scoring.
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM "ScholarshipAttempt"`);
  if (rows[0].n === 0) {
    const del = await client.query(`DELETE FROM "ScholarshipQuestion" WHERE NOT ("id" = ANY($1))`, [keep]);
    if (del.rowCount) console.log(`scholarship-sync: removed ${del.rowCount} stale question(s)`);
  } else {
    const stale = await client.query(`SELECT count(*)::int AS n FROM "ScholarshipQuestion" WHERE NOT ("id" = ANY($1))`, [keep]);
    if (stale.rows[0].n) console.warn(`scholarship-sync: ${stale.rows[0].n} stale question(s) kept because exam attempts exist`);
  }

  await client.query("COMMIT");
  console.log(`scholarship-sync: ${bank.categories.length} categories, ${bank.questions.length} questions, ${Object.keys(bank.media ?? {}).length} images`);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  await client.end();
}
