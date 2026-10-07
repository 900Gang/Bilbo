-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill: existing tasks start in "newest first" order, so manual ordering matches what users already see.
UPDATE "Task" AS t
SET "position" = ranked.rn
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" DESC) AS rn
  FROM "Task"
) AS ranked
WHERE t."id" = ranked."id";
