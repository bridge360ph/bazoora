-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "startBranchId" TEXT;

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "wasteType" TEXT;
