-- Blog: a BLOGGER role (own panel), the author byline and the posts. Idempotent.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BLOGGER';

DO $$ BEGIN
  CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BlogAuthor" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "position" TEXT NOT NULL DEFAULT 'Bloq müəllifi',
  "bio" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "BlogAuthor_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BlogAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "BlogAuthor_userId_key" ON "BlogAuthor"("userId");

CREATE TABLE IF NOT EXISTS "BlogPost" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL DEFAULT '',
  "content" TEXT NOT NULL,
  "coverUrl" TEXT,
  "coverAlt" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "metaTitle" TEXT NOT NULL DEFAULT '',
  "metaDescription" TEXT NOT NULL DEFAULT '',
  "views" INTEGER NOT NULL DEFAULT 0,
  "readingMinutes" INTEGER NOT NULL DEFAULT 1,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "BlogAuthor"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");
CREATE INDEX IF NOT EXISTS "BlogPost_authorId_idx" ON "BlogPost"("authorId");
