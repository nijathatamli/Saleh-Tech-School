// Regression: prisma/schema.prisma must match a database built from prisma/init.sql + prisma/patches/*.sql
// (that is how every new environment, including a replacement Render database, is created).
// A model field without its column makes every default Prisma read of that model fail at runtime.
//
//   node --test qa/tests/schema-drift.test.mjs      (uses the QA database from helpers.mjs, or QA_DATABASE_URL)
import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { Prisma } from "@prisma/client";

import { DB_URL as url } from "./helpers.mjs"; // refuses anything but the isolated local QA database

const client = new pg.Client({ connectionString: url });
await client.connect();
test.after(() => client.end());

const models = Prisma.dmmf.datamodel.models;
const table = (m) => m.dbName ?? m.name;
const dbCols = new Map();
for (const r of (await client.query(`select table_name, column_name, is_nullable, column_default from information_schema.columns where table_schema='public'`)).rows) {
  if (!dbCols.has(r.table_name)) dbCols.set(r.table_name, new Map());
  dbCols.get(r.table_name).set(r.column_name, r);
}

test("every Prisma table exists", () => {
  const missing = models.filter((m) => !dbCols.has(table(m))).map(table);
  assert.deepEqual(missing, [], `tables missing from the database: ${missing.join(", ")}`);
});

test("every Prisma scalar field has a column", () => {
  const missing = [];
  for (const m of models) {
    const cols = dbCols.get(table(m));
    if (!cols) continue;
    for (const f of m.fields.filter((x) => x.kind === "scalar" || x.kind === "enum")) {
      if (!cols.has(f.dbName ?? f.name)) missing.push(`${table(m)}.${f.dbName ?? f.name}`);
    }
  }
  assert.deepEqual(missing, [], `columns declared in schema.prisma but missing from init.sql + patches: ${missing.join(", ")}`);
});

test("optional Prisma fields are nullable, and no unknown NOT NULL column lacks a default", () => {
  const problems = [];
  for (const m of models) {
    const cols = dbCols.get(table(m));
    if (!cols) continue;
    const known = new Set(m.fields.filter((x) => x.kind === "scalar" || x.kind === "enum").map((x) => x.dbName ?? x.name));
    for (const f of m.fields.filter((x) => x.kind === "scalar" || x.kind === "enum")) {
      const c = cols.get(f.dbName ?? f.name);
      if (c && !f.isRequired && c.is_nullable === "NO" && c.column_default === null) problems.push(`${table(m)}.${c.column_name}: optional in Prisma but NOT NULL in the database`);
    }
    for (const [name, c] of cols) {
      if (!known.has(name) && c.is_nullable === "NO" && c.column_default === null) problems.push(`${table(m)}.${name}: unknown to Prisma, NOT NULL without default (inserts would fail)`);
    }
  }
  assert.deepEqual(problems, []);
});

test("every unique constraint / unique index declared in Prisma exists in the database", async () => {
  const idx = (await client.query(`
    select t.relname as tbl, array_agg(a.attname::text order by k.ord) as cols
    from pg_index ix join pg_class t on t.oid = ix.indrelid join pg_namespace n on n.oid = t.relnamespace
    join lateral unnest(ix.indkey) with ordinality as k(attnum, ord) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum
    where ix.indisunique and n.nspname = 'public' group by ix.indexrelid, t.relname`)).rows;
  const have = new Set(idx.map((r) => `${r.tbl}(${r.cols.join(",")})`));
  const missing = [];
  for (const m of models) {
    const want = [];
    for (const f of m.fields) if ((f.isUnique || f.isId) && (f.kind === "scalar" || f.kind === "enum")) want.push([f.dbName ?? f.name]);
    for (const u of [...m.uniqueIndexes, ...(m.primaryKey ? [m.primaryKey] : [])]) want.push(u.fields.map((n) => m.fields.find((x) => x.name === n)?.dbName ?? n));
    for (const cols of want) if (!have.has(`${table(m)}(${cols.join(",")})`)) missing.push(`${table(m)}(${cols.join(",")})`);
  }
  assert.deepEqual([...new Set(missing)], [], "unique constraints missing from the database");
});

test("every relation's foreign key column exists and is indexed or constrained", async () => {
  const fks = (await client.query(`
    select c.conrelid::regclass::text as tbl, array_agg(a.attname::text order by k.ord) as cols
    from pg_constraint c
    join lateral unnest(c.conkey) with ordinality as k(attnum, ord) on true
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.contype = 'f' and c.connamespace = 'public'::regnamespace group by c.oid, c.conrelid`)).rows;
  const have = new Set(fks.map((r) => `${r.tbl.replace(/"/g, "")}(${r.cols.join(",")})`));
  const missing = [];
  for (const m of models) {
    for (const f of m.fields.filter((x) => x.kind === "object" && x.relationFromFields?.length)) {
      const cols = f.relationFromFields.map((n) => m.fields.find((x) => x.name === n)?.dbName ?? n);
      if (!have.has(`${table(m)}(${cols.join(",")})`)) missing.push(`${table(m)}(${cols.join(",")}) -> ${f.type}`);
    }
  }
  assert.deepEqual(missing, [], "foreign keys declared in Prisma but absent in the database");
});

test("every @@index declared in Prisma exists in the database (leading columns match)", async () => {
  const idx = (await client.query(`
    select t.relname as tbl, array_agg(a.attname::text order by k.ord) as cols
    from pg_index ix join pg_class t on t.oid = ix.indrelid join pg_namespace n on n.oid = t.relnamespace
    join lateral unnest(ix.indkey) with ordinality as k(attnum, ord) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = k.attnum
    where n.nspname = 'public' group by ix.indexrelid, t.relname`)).rows;
  const missing = [];
  for (const ix of Prisma.dmmf.datamodel.indexes ?? []) {
    const m = models.find((x) => x.name === ix.model);
    const cols = ix.fields.map((f) => m.fields.find((x) => x.name === f.name)?.dbName ?? f.name);
    const ok = idx.some((r) => r.tbl === table(m) && cols.every((c, i) => r.cols[i] === c));
    if (!ok) missing.push(`${table(m)}(${cols.join(",")})`);
  }
  assert.deepEqual(missing, [], "indexes declared in schema.prisma but missing from the database");
});

test("no foreign-key column is left without a supporting index", async () => {
  const rows = (await client.query(`
    select c.conrelid::regclass::text || '.' || a.attname as fk_column
    from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f' and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
    order by 1`)).rows.map((r) => r.fk_column);
  assert.deepEqual(rows, [], "foreign keys without an index (slow joins / slow cascading deletes)");
});
