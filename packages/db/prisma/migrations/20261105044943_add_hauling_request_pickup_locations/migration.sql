-- AlterTable
ALTER TABLE "HaulingRequest" ADD COLUMN     "keepStopOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupLocations" JSONB;

