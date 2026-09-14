/**
 * Syncs the teacher roster into an ALREADY-SEEDED database.
 *
 * `prisma/seed.ts` can only run against a fresh database — it uses `create`,
 * so on a populated database it fails on the unique email constraint. This
 * script instead updates the existing rows, matched by email, which is safe to
 * re-run and touches nothing else (no deletes, no student/payment data).
 *
 * Usage:
 *   npm run db:sync-teachers                        # uses DATABASE_URL from .env
 *   DATABASE_URL="postgres://..." npm run db:sync-teachers   # e.g. production
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { teacherRoster } from "../prisma/teacher-roster";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const host = process.env.DATABASE_URL?.replace(/:\/\/[^@]*@/, "://***@") ?? "(unset)";
  console.log(`Syncing ${teacherRoster.length} teachers into: ${host}\n`);

  let updated = 0;
  let missing = 0;

  for (const t of teacherRoster) {
    const existing = await prisma.user.findUnique({
      where: { email: t.email },
      include: { teacherProfile: true },
    });

    if (!existing?.teacherProfile) {
      console.log(`  SKIP  ${t.email} — no teacher record in this database`);
      missing += 1;
      continue;
    }

    await prisma.user.update({
      where: { email: t.email },
      data: {
        name: t.name,
        avatarUrl: t.photoUrl,
        teacherProfile: {
          update: {
            position: t.position,
            bio: t.bio,
            experienceYears: t.experienceYears,
            specializations: t.specializations,
            photoUrl: t.photoUrl,
          },
        },
      },
    });
    console.log(`  OK    ${t.name} — ${t.position} — ${t.photoUrl}`);
    updated += 1;
  }

  console.log(`\nDone. ${updated} updated, ${missing} skipped.`);
  if (missing > 0) {
    console.log("Skipped entries exist in the roster but not in this database; seed it first.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
