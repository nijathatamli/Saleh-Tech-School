-- Scholarship exam without accounts: candidates register once with a 32-character course
-- code (no password, no login) and give phone + email. Admins read the results.
-- Brings databases that already ran 2026-10-01-scholarship-exam.sql to the new shape. Idempotent.
ALTER TABLE "ScholarshipStudent" DROP COLUMN IF EXISTS "passwordHash";
ALTER TABLE "ScholarshipStudent" DROP COLUMN IF EXISTS "failedLogins";
ALTER TABLE "ScholarshipStudent" DROP COLUMN IF EXISTS "lockedUntil";
ALTER TABLE "ScholarshipStudent" DROP COLUMN IF EXISTS "lastLoginAt";
ALTER TABLE "ScholarshipStudent" ADD COLUMN IF NOT EXISTS "phone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ScholarshipStudent" ADD COLUMN IF NOT EXISTS "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "ScholarshipStudent" ALTER COLUMN "phone" DROP DEFAULT;
ALTER TABLE "ScholarshipStudent" ALTER COLUMN "email" DROP DEFAULT;
ALTER TABLE "ScholarshipAttempt" ADD COLUMN IF NOT EXISTS "scholarshipPercent" INTEGER;

CREATE TABLE IF NOT EXISTS "ScholarshipCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "studentId" TEXT,
    CONSTRAINT "ScholarshipCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ScholarshipCode_code_key" ON "ScholarshipCode"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "ScholarshipCode_studentId_key" ON "ScholarshipCode"("studentId");
DO $$ BEGIN
  ALTER TABLE "ScholarshipCode" ADD CONSTRAINT "ScholarshipCode_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ScholarshipStudent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
