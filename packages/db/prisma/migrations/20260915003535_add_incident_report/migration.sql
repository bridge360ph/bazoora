-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DENIED');

-- CreateTable
CREATE TABLE "IncidentReport" (
    "id" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "routeId" TEXT,
    "stopName" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncidentReport_reportNumber_key" ON "IncidentReport"("reportNumber");

-- CreateIndex
CREATE INDEX "IncidentReport_reporterId_idx" ON "IncidentReport"("reporterId");

-- CreateIndex
CREATE INDEX "IncidentReport_routeId_idx" ON "IncidentReport"("routeId");

-- CreateIndex
CREATE INDEX "IncidentReport_status_idx" ON "IncidentReport"("status");

-- AddForeignKey
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;
