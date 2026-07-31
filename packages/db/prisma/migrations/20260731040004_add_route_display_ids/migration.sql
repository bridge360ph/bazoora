/*
  Warnings:

  - A unique constraint covering the columns `[truckNumber]` on the table `Truck` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "truckNumber" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userNumber" TEXT;

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
