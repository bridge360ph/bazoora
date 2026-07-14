/*
  Warnings:

  - Added the required column `waste_type` to the `HaulingRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WasteType" AS ENUM ('RESIDUAL', 'NON_BIODEGRADABLE', 'HAZARDOUS', 'BIODEGRADABLE');

-- AlterTable
ALTER TABLE "HaulingRequest" ADD COLUMN     "waste_type" "WasteType" NOT NULL;
