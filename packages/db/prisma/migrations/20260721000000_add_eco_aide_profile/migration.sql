-- These enum types may already exist locally because of the legacy EcoAide table.
DO $$
BEGIN
  CREATE TYPE "EcoAideStatus" AS ENUM (
    'ACTIVE',
    'SUSPENDED',
    'DEACTIVATED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
  CREATE TYPE "EcoAideAvailability" AS ENUM (
    'AVAILABLE',
    'ON_ROUTE',
    'OFF_DUTY'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "EcoAideProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "phone" TEXT,
  "status" "EcoAideStatus" NOT NULL DEFAULT 'ACTIVE',
  "availability" "EcoAideAvailability" NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "EcoAideProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EcoAideProfile_userId_key"
ON "EcoAideProfile"("userId");

DO $$
BEGIN
  ALTER TABLE "EcoAideProfile"
  ADD CONSTRAINT "EcoAideProfile_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
