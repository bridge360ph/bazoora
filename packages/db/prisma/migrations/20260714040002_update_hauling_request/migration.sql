/*
  Warnings:

  - The `status` column on the `HaulingRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "HaulingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- AlterTable
ALTER TABLE "HaulingRequest" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "denial_reason" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "HaulingRequestStatus" NOT NULL DEFAULT 'PENDING';
