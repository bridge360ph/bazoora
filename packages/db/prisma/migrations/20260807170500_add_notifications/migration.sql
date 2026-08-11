CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationReceipt" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationReceipt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_createdAt_idx"
ON "Notification"("createdAt");

CREATE UNIQUE INDEX "NotificationReceipt_notificationId_userId_key"
ON "NotificationReceipt"("notificationId", "userId");

CREATE INDEX "NotificationReceipt_userId_readAt_idx"
ON "NotificationReceipt"("userId", "readAt");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_createdById_fkey"
FOREIGN KEY ("createdById")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "NotificationReceipt"
ADD CONSTRAINT "NotificationReceipt_notificationId_fkey"
FOREIGN KEY ("notificationId")
REFERENCES "Notification"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "NotificationReceipt"
ADD CONSTRAINT "NotificationReceipt_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
