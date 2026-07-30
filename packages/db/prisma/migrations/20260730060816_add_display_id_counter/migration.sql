/*
  Warnings:

  - A unique constraint covering the columns `[truckNumber]` on the table `Truck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "DriverLocation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "truckId" TEXT;

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "truckNumber" TEXT,
ALTER COLUMN "model" DROP NOT NULL,
ALTER COLUMN "capacity" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "userNumber" TEXT,
ALTER COLUMN "password" SET NOT NULL;

-- CreateTable
CREATE TABLE "Counter" (
    "entity" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("entity")
);

-- CreateIndex
CREATE UNIQUE INDEX "Truck_truckNumber_key" ON "Truck"("truckNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_userNumber_key" ON "User"("userNumber");

-- AddForeignKey
ALTER TABLE "DriverLocation" ADD CONSTRAINT "DriverLocation_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
