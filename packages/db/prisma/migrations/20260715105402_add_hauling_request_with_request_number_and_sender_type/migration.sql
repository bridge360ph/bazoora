/*
  Warnings:

  - You are about to drop the `ServiceRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "HaulingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "WasteType" AS ENUM ('RESIDUAL', 'NON_BIODEGRADABLE', 'HAZARDOUS', 'BIODEGRADABLE');

-- CreateEnum
CREATE TYPE "SenderType" AS ENUM ('RESIDENT', 'BUSINESS');

-- DropTable
DROP TABLE "ServiceRequest";

-- CreateTable
CREATE TABLE "RequestCounter" (
    "id" TEXT NOT NULL DEFAULT 'hauling_request',
    "lastValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RequestCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HaulingRequest" (
    "request_id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT,
    "request_address" TEXT NOT NULL,
    "sender_type" "SenderType",
    "waste_type" "WasteType" NOT NULL,
    "image_url" TEXT,
    "pickup_date" TIMESTAMP(3),
    "status" "HaulingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "denial_reason" TEXT,
    "note" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HaulingRequest_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HaulingRequest_request_number_key" ON "HaulingRequest"("request_number");
