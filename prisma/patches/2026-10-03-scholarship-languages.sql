-- Scholarship exam in Azerbaijani / English / Russian: the candidate picks the language when
-- registering; questions carry their translations. Idempotent.
ALTER TABLE "ScholarshipStudent" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'az';
ALTER TABLE "ScholarshipQuestion" ADD COLUMN IF NOT EXISTS "translations" JSONB;
