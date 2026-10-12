-- Admin operations: settings, lesson status/room/duration, class capacity, course active flag,
-- admissions (rejected + link to the created student), notification event kinds, extra indexes
-- on hot foreign keys, and RESTRICT instead of CASCADE where a delete would erase financial
-- or student history. Idempotent.
DO $$ BEGIN
  CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "LeadStage" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "capacity" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "room" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE "TrialBooking" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
ALTER TABLE "TrialBooking" ADD COLUMN IF NOT EXISTS "convertedStudentId" TEXT;
ALTER TABLE "TrialBooking" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "event" TEXT;

CREATE TABLE IF NOT EXISTS "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

CREATE INDEX IF NOT EXISTS "StudentProfile_parentId_idx" ON "StudentProfile"("parentId");
CREATE INDEX IF NOT EXISTS "Course_active_idx" ON "Course"("active");
CREATE INDEX IF NOT EXISTS "ClassGroup_courseId_idx" ON "ClassGroup"("courseId");
CREATE INDEX IF NOT EXISTS "Lesson_classId_date_idx" ON "Lesson"("classId", "date");
CREATE INDEX IF NOT EXISTS "Lesson_date_idx" ON "Lesson"("date");
CREATE INDEX IF NOT EXISTS "Homework_lessonId_idx" ON "Homework"("lessonId");
CREATE INDEX IF NOT EXISTS "Submission_homeworkId_idx" ON "Submission"("homeworkId");
CREATE INDEX IF NOT EXISTS "Submission_studentId_idx" ON "Submission"("studentId");
CREATE INDEX IF NOT EXISTS "Grade_studentId_idx" ON "Grade"("studentId");
CREATE INDEX IF NOT EXISTS "TrialBooking_stage_idx" ON "TrialBooking"("stage");
CREATE INDEX IF NOT EXISTS "TrialBooking_createdAt_idx" ON "TrialBooking"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_event_idx" ON "Notification"("event");

DO $$ BEGIN
  ALTER TABLE "TrialBooking" ADD CONSTRAINT "TrialBooking_convertedStudentId_fkey" FOREIGN KEY ("convertedStudentId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- history must survive a mistaken delete: refuse instead of cascading (only rewritten when still CASCADE)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentProfile_parentId_fkey' AND confdeltype <> 'r') THEN
    ALTER TABLE "StudentProfile" DROP CONSTRAINT "StudentProfile_parentId_fkey";
    ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_parentId_fkey' AND confdeltype <> 'r') THEN
    ALTER TABLE "Payment" DROP CONSTRAINT "Payment_parentId_fkey";
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassGroup_courseId_fkey' AND confdeltype <> 'r') THEN
    ALTER TABLE "ClassGroup" DROP CONSTRAINT "ClassGroup_courseId_fkey";
    ALTER TABLE "ClassGroup" ADD CONSTRAINT "ClassGroup_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Enrollment_courseId_fkey' AND confdeltype <> 'r') THEN
    ALTER TABLE "Enrollment" DROP CONSTRAINT "Enrollment_courseId_fkey";
    ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
