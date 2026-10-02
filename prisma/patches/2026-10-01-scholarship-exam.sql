-- Scholarship exam ("Reqamsal Gələcək"): FIN-based candidates, question bank imported from
-- the DOCX files, one attempt per candidate. Idempotent. The old demo table
-- "ScholarshipApplication" is intentionally left in place (no data is dropped).
DO $$ BEGIN
  CREATE TYPE "ScholarshipSubject" AS ENUM ('LOGIC', 'MATH', 'ENGLISH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ScholarshipAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ScholarshipCategory" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "gradeFrom" INTEGER NOT NULL,
    "gradeTo" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "sourceFile" TEXT NOT NULL,
    CONSTRAINT "ScholarshipCategory_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "ScholarshipQuestion" (
    "id" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "subject" "ScholarshipSubject" NOT NULL,
    "part" INTEGER NOT NULL DEFAULT 1,
    "number" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "imageIds" TEXT[],
    "correctLabel" TEXT,
    "answerText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScholarshipQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScholarshipMedia" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    CONSTRAINT "ScholarshipMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScholarshipStudent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "finHash" TEXT NOT NULL,
    "finEncrypted" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "failedLogins" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScholarshipStudent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ScholarshipAttempt" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" "ScholarshipAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "questionIds" TEXT[],
    "answers" JSONB NOT NULL DEFAULT '{}',
    "score" INTEGER,
    "total" INTEGER NOT NULL,
    "percent" INTEGER,
    "subjectScores" JSONB,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ScholarshipAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ScholarshipQuestion_categoryKey_position_idx" ON "ScholarshipQuestion"("categoryKey", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "ScholarshipQuestion_categoryKey_subject_part_number_key" ON "ScholarshipQuestion"("categoryKey", "subject", "part", "number");
CREATE UNIQUE INDEX IF NOT EXISTS "ScholarshipStudent_finHash_key" ON "ScholarshipStudent"("finHash");
CREATE UNIQUE INDEX IF NOT EXISTS "ScholarshipAttempt_studentId_key" ON "ScholarshipAttempt"("studentId");

DO $$ BEGIN
  ALTER TABLE "ScholarshipQuestion" ADD CONSTRAINT "ScholarshipQuestion_categoryKey_fkey" FOREIGN KEY ("categoryKey") REFERENCES "ScholarshipCategory"("key") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ScholarshipStudent" ADD CONSTRAINT "ScholarshipStudent_categoryKey_fkey" FOREIGN KEY ("categoryKey") REFERENCES "ScholarshipCategory"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ScholarshipAttempt" ADD CONSTRAINT "ScholarshipAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "ScholarshipStudent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
