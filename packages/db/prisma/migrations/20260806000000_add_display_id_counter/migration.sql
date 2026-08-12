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
