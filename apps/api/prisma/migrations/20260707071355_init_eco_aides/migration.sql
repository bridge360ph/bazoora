-- CreateEnum
CREATE TYPE "EcoAideStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "EcoAideAvailability" AS ENUM ('AVAILABLE', 'ON_ROUTE', 'OFF_DUTY');

-- CreateTable
CREATE TABLE "EcoAide" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "EcoAideStatus" NOT NULL DEFAULT 'ACTIVE',
    "availability" "EcoAideAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcoAide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EcoAide_email_key" ON "EcoAide"("email");
