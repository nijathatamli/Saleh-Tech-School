-- "Maksimal bal" on the new-homework form used to be ignored (every grade was out of 100). It is stored now. Idempotent.
ALTER TABLE "Homework" ADD COLUMN IF NOT EXISTS "maxScore" INTEGER NOT NULL DEFAULT 100;
