import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Uses the pg driver directly via Prisma's driver-adapter interface, bypassing
// Prisma's native Rust engine connection layer entirely. That engine has a known
// incompatibility with our local dev database's non-standard server_version
// banner (PGlite, a WASM-compiled Postgres). node-postgres itself connects fine.
// The local PGlite socket serves a single client at a time, so in development
// the idle connection is released quickly — scripts (patches, tests) can then
// take their turn between requests.
// Connections per server instance. The local PGlite dev database accepts one client at a time (max 1); production uses a
// real pool so one slow page does not queue every other visitor behind it. Override with DATABASE_POOL_MAX.
const poolMax = Number(process.env.DATABASE_POOL_MAX) || (process.env.NODE_ENV === "production" ? 5 : 1);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: poolMax,
  idleTimeoutMillis: process.env.NODE_ENV === "development" ? 750 : 10_000,
});
pool.on("error", (err) => console.error("[pg pool]", err.message));
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
