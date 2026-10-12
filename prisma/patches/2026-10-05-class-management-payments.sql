-- Admin class management + lesson-based payment cycles. Idempotent.
--  * ClassGroup gets a status (ACTIVE/ARCHIVED), archive time, lessons-per-cycle and timestamps
--  * Enrollment (class membership) and Attendance (lesson participation) get unique keys
--  * Attendance.completed marks the lessons that count towards a payment cycle
--  * Payment gains student/class/cycle links; DUE + CANCELLED statuses
--  * User.active / StudentProfile.active/grade/FIN for the admin student form
DO $$ BEGIN
  CREATE TYPE "ClassStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'DUE';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "finEncrypted" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "finHash" TEXT;
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "grade" INTEGER;

ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);
ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "lessonsPerCycle" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "status" "ClassStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "completed" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "classId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "cycle" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "lessonsFrom" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "lessonsTo" INTEGER;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "studentId" TEXT;

-- one membership per (class, student) and one attendance row per (lesson, student): drop older duplicates first
DELETE FROM "Enrollment" e USING "Enrollment" k
  WHERE e."classId" IS NOT NULL AND e."classId" = k."classId" AND e."studentId" = k."studentId"
    AND (e."startedAt", e."id") > (k."startedAt", k."id");
DELETE FROM "Attendance" a USING "Attendance" k
  WHERE a."lessonId" = k."lessonId" AND a."studentId" = k."studentId"
    AND (a."updatedAt", a."id") < (k."updatedAt", k."id");

CREATE UNIQUE INDEX IF NOT EXISTS "StudentProfile_finHash_key" ON "StudentProfile"("finHash");
CREATE INDEX IF NOT EXISTS "Enrollment_studentId_idx" ON "Enrollment"("studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_classId_studentId_key" ON "Enrollment"("classId", "studentId");
CREATE INDEX IF NOT EXISTS "ClassGroup_teacherId_idx" ON "ClassGroup"("teacherId");
CREATE INDEX IF NOT EXISTS "ClassGroup_status_idx" ON "ClassGroup"("status");
CREATE INDEX IF NOT EXISTS "Attendance_studentId_idx" ON "Attendance"("studentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_lessonId_studentId_key" ON "Attendance"("lessonId", "studentId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_studentId_idx" ON "Payment"("studentId");
CREATE INDEX IF NOT EXISTS "Payment_classId_idx" ON "Payment"("classId");
CREATE INDEX IF NOT EXISTS "Payment_parentId_idx" ON "Payment"("parentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_studentId_classId_cycle_key" ON "Payment"("studentId", "classId", "cycle");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Payment" ADD CONSTRAINT "Payment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "ClassGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
