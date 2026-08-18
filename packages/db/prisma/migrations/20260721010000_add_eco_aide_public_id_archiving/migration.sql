ALTER TABLE "EcoAideProfile"
ADD COLUMN "sequenceNumber" SERIAL NOT NULL,
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "EcoAideProfile_sequenceNumber_key"
ON "EcoAideProfile"("sequenceNumber");

ALTER TABLE "EcoAideProfile"
DROP CONSTRAINT IF EXISTS "EcoAideProfile_userId_fkey";

ALTER TABLE "EcoAideProfile"
ADD CONSTRAINT "EcoAideProfile_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
