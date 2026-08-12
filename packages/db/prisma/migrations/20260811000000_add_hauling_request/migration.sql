-- CreateEnum
CREATE TYPE "HaulingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "WasteType" AS ENUM ('RESIDUAL', 'NON_BIODEGRADABLE', 'HAZARDOUS', 'BIODEGRADABLE');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('RESIDENT', 'BUSINESS');

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

