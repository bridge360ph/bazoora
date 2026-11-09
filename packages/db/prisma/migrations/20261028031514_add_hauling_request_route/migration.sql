-- AlterTable
ALTER TABLE "HaulingRequest" ADD COLUMN     "routeId" TEXT;

-- CreateIndex
CREATE INDEX "HaulingRequest_routeId_idx" ON "HaulingRequest"("routeId");

-- AddForeignKey
ALTER TABLE "HaulingRequest" ADD CONSTRAINT "HaulingRequest_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

