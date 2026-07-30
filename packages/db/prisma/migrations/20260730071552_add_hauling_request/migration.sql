/*
  Warnings:

  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "HaulingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "WasteType" AS ENUM ('RESIDUAL', 'NON_BIODEGRADABLE', 'HAZARDOUS', 'BIODEGRADABLE');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('RESIDENT', 'BUSINESS');

-- AlterTable
ALTER TABLE "DriverLocation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "truckId" TEXT;

-- AlterTable
ALTER TABLE "Truck" ALTER COLUMN "model" DROP NOT NULL,
ALTER COLUMN "capacity" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ALTER COLUMN "password" SET NOT NULL;

-- CreateTable
CREATE TABLE "Counter" (
    "entity" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("entity")
);

-- CreateTable
CREATE TABLE "RequestCounter" (
    "id" TEXT NOT NULL DEFAULT 'hauling_request',
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RequestCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaulingRequest" (
    "requestId" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "requestAddress" TEXT NOT NULL,
    "senderType" "SenderType" NOT NULL,
    "wasteType" "WasteType" NOT NULL,
    "imageUrl" TEXT,
    "pickupDate" TIMESTAMP(3),
    "status" "HaulingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "denialReason" TEXT,
    "note" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaulingRequest_pkey" PRIMARY KEY ("requestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "HaulingRequest_requestNumber_key" ON "HaulingRequest"("requestNumber");

-- AddForeignKey
ALTER TABLE "DriverLocation" ADD CONSTRAINT "DriverLocation_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE SET NULL ON UPDATE CASCADE;
