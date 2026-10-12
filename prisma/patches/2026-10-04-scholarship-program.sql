-- Program the scholarship candidate applies for (cybersecurity, electronics, programming, robotics, ai). Idempotent.
ALTER TABLE "ScholarshipStudent" ADD COLUMN IF NOT EXISTS "program" TEXT NOT NULL DEFAULT '';
