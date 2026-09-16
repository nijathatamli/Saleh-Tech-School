-- Parent portal: notification preference toggles (Tənzimləmələr → Bildirişlər).
-- Idempotent: safe to run on a database that already has the columns.
ALTER TABLE "ParentProfile" ADD COLUMN IF NOT EXISTS "notifyLessons" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ParentProfile" ADD COLUMN IF NOT EXISTS "notifyGrades" BOOLEAN NOT NULL DEFAULT true;
