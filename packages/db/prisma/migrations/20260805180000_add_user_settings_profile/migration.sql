CREATE TABLE "UserSettingsProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "streetAddress" TEXT,
    "barangay" TEXT,
    "cityMunicipality" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "dailySummary" BOOLEAN NOT NULL DEFAULT false,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "autoAssignRoutes" BOOLEAN NOT NULL DEFAULT true,
    "realTimeTracking" BOOLEAN NOT NULL DEFAULT true,
    "automaticReports" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettingsProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSettingsProfile_userId_key"
ON "UserSettingsProfile"("userId");

ALTER TABLE "UserSettingsProfile"
ADD CONSTRAINT "UserSettingsProfile_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;