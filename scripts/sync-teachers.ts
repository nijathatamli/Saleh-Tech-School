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
import bcrypt from "bcryptjs";
import { teacherRoster } from "../prisma/teacher-roster";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

/**
 * Teachers are listed publicly in roster order, which the app derives from
 * `user.createdAt`. So a newly inserted teacher gets a createdAt just after the
 * nearest earlier roster entry that already exists, landing them in the right
 * slot instead of always at the end.
 */
async function createdAtForRosterIndex(index: number): Promise<Date | undefined> {
  const at = async (i: number) =>
    (
      await prisma.user.findUnique({
        where: { email: teacherRoster[i].email },
        select: { createdAt: true },
      })
    )?.createdAt;

  let before: Date | undefined;
  for (let i = index - 1; i >= 0 && !before; i -= 1) before = await at(i);

  let after: Date | undefined;
  for (let i = index + 1; i < teacherRoster.length && !after; i += 1) after = await at(i);

  // Seeded teachers can sit milliseconds apart, so a fixed offset after
  // `before` would overshoot `after` and land the newcomer at the end of the
  // list. Split the gap instead.
  if (before && after) return new Date((before.getTime() + after.getTime()) / 2);
  if (before) return new Date(before.getTime() + 1000);
  if (after) return new Date(after.getTime() - 1000);
  return undefined;
}

async function main() {
  const host = process.env.DATABASE_URL?.replace(/:\/\/[^@]*@/, "://***@") ?? "(unset)";
  console.log(`Syncing ${teacherRoster.length} teachers into: ${host}\n`);

  let updated = 0;
  let created = 0;

  for (const [index, t] of teacherRoster.entries()) {
    const existing = await prisma.user.findUnique({
      where: { email: t.email },
      include: { teacherProfile: true },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          name: t.name,
          email: t.email,
          passwordHash: await bcrypt.hash("teacher123", 10),
          role: "TEACHER",
          avatarUrl: t.photoUrl,
          createdAt: await createdAtForRosterIndex(index),
          teacherProfile: {
            create: {
              position: t.position,
              bio: t.bio,
              experienceYears: t.experienceYears,
              specializations: t.specializations,
              photoUrl: t.photoUrl,
            },
          },
        },
      });
      console.log(`  NEW   ${t.name} — ${t.position} — ${t.photoUrl}`);
      created += 1;
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

  console.log(`\nDone. ${updated} updated, ${created} created.`);
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
