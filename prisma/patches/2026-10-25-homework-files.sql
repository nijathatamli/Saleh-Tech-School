-- Files attached to homework by the teacher (bytes stored in the database). Idempotent.
CREATE TABLE IF NOT EXISTS "HomeworkFile" (
  "id" TEXT NOT NULL,
  "homeworkId" TEXT,
  "uploaderId" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomeworkFile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HomeworkFile_homeworkId_fkey" FOREIGN KEY ("homeworkId") REFERENCES "Homework"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "HomeworkFile_homeworkId_idx" ON "HomeworkFile"("homeworkId");
CREATE INDEX IF NOT EXISTS "HomeworkFile_uploaderId_createdAt_idx" ON "HomeworkFile"("uploaderId", "createdAt");
