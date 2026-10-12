-- schema.prisma declares these columns, the production database already has them (it was created by the
-- original `prisma db push`), but prisma/init.sql and the earlier patches never created them. A database built
-- from init.sql + patches (every new environment) therefore failed on any default Prisma read of ClassGroup
-- or Payment. Idempotent; a no-op on production.
ALTER TABLE "ClassGroup" ADD COLUMN IF NOT EXISTS "monthlyExpectedClasses" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "receiptUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "receiptSubmittedAt" TIMESTAMP(3);
