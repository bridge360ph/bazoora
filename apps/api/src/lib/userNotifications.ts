import type { Prisma } from "@bazoora/db";
import { io } from "../plugins/socket.js";

/**
 * Audience label for notifications sent to one user about their own records
 * (as opposed to admin broadcasts such as "Residents" or "All Users").
 * The admin broadcast history excludes this audience.
 */
export const DIRECT_AUDIENCE = "Direct";

export const HAULING_NOTIFICATION_TYPES = {
  pending: "HAULING_REQUEST_PENDING",
  approved: "HAULING_REQUEST_APPROVED",
  denied: "HAULING_REQUEST_DENIED",
} as const;

interface DirectNotificationInput {
  userId: string;
  createdById: string;
  type: string;
  title: string;
  message: string;
}

/**
 * Creates a notification addressed to a single user. Call inside the same
 * transaction as the change it describes, then call `emitNotificationCreated`
 * after the transaction commits.
 */
export async function createDirectNotification(
  tx: Prisma.TransactionClient,
  input: DirectNotificationInput,
): Promise<{ notificationId: string; userId: string }> {
  const notification = await tx.notification.create({
    data: {
      type: input.type,
      audience: DIRECT_AUDIENCE,
      title: input.title,
      message: input.message,
      createdById: input.createdById,
      receipts: {
        create: { userId: input.userId },
      },
    },
  });

  return { notificationId: notification.id, userId: input.userId };
}

/** Tells the recipient's open sessions to refetch their notifications. */
export function emitNotificationCreated(created: {
  notificationId: string;
  userId: string;
}): void {
  io?.to(`user:${created.userId}`).emit("notification:new", {
    notificationId: created.notificationId,
  });
}
