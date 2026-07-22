/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "DriverLocation" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "capacity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "assignedDriverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "routeNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "waypoints" TEXT NOT NULL,
    "wasteType" TEXT NOT NULL,
    "collectionDay" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Not Started',
    "stops" INTEGER NOT NULL DEFAULT 0,
    "routeType" TEXT NOT NULL,
    "assignedEcoAideId" TEXT,
    "assignedTruckId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverLocation_driverId_key" ON "DriverLocation"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_plateNumber_key" ON "Truck"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_assignedDriverId_key" ON "Truck"("assignedDriverId");

-- CreateIndex
CREATE UNIQUE INDEX "Route_routeNumber_key" ON "Route"("routeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Route_assignedEcoAideId_key" ON "Route"("assignedEcoAideId");

-- CreateIndex
CREATE UNIQUE INDEX "Route_assignedTruckId_key" ON "Route"("assignedTruckId");

-- AddForeignKey
ALTER TABLE "DriverLocation" ADD CONSTRAINT "DriverLocation_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_assignedEcoAideId_fkey" FOREIGN KEY ("assignedEcoAideId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_assignedTruckId_fkey" FOREIGN KEY ("assignedTruckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;