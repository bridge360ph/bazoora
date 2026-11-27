-- AlterTable
ALTER TABLE "HaulingRequest" ADD COLUMN     "routeAssignedAt" TIMESTAMP(3);

-- Backfill: requests already on a route count as put on it when they were
-- approved (or last updated, for requests with no approval time).
UPDATE "HaulingRequest"
SET "routeAssignedAt" = COALESCE("approvedAt", "updatedAt")
WHERE "routeId" IS NOT NULL;
