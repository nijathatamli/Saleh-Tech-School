import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

// Uses the pg driver directly via Prisma's driver-adapter interface, bypassing
// Prisma's native Rust engine connection layer entirely. That engine has a known
// incompatibility with our local dev database's non-standard server_version
// banner (PGlite, a WASM-compiled Postgres). node-postgres itself connects fine.
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
