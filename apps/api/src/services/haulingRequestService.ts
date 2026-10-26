import { prisma } from "@bazoora/db";
import type { Prisma } from "@bazoora/db";
import { HaulingRequestStatus } from "@prisma/client";
import type { CreateHaulingRequestInput } from "@bazoora/shared";
import { mapHaulingRequest } from "../lib/haulingRequestMapper.js";
import { generateHaulingRequestNumber } from "../lib/displayId.js";
import { getNextSequence } from "../lib/counter.js";
import {
  createPresignedImageUpload,
  resolveUploadedImageUrl,
} from "../lib/s3ImageUpload.js";
import {
  HAULING_NOTIFICATION_TYPES,
  createDirectNotification,
  emitNotificationCreated,
} from "../lib/userNotifications.js";

export const DENIAL_REASON_MIN_LENGTH = 5;
export const DENIAL_REASON_MAX_LENGTH = 500;

/** Thrown for a denial reason that is too short once trimmed, or too long. */
export class InvalidDenialReasonError extends Error {}

const WASTE_TYPE_LABELS: Record<string, string> = {
  RESIDUAL: "residual waste",
  NON_BIODEGRADABLE: "non-biodegradable waste",
  HAZARDOUS: "hazardous waste",
  BIODEGRADABLE: "biodegradable waste",
};

function formatPickupDate(date: Date | null): string {
  if (!date) return "the requested date";
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function describeRequest(request: {
  requestNumber: string;
  wasteType: string;
  pickupDate: Date | null;
}): string {
  const waste = WASTE_TYPE_LABELS[request.wasteType] ?? "waste";
  return `${request.requestNumber} (${waste}, pickup ${formatPickupDate(request.pickupDate)})`;
}

/**
 * Get all hauling requests
 */
export async function getHaulingRequests(
  userId?: string,
) {
  const requests =
    await prisma.haulingRequest.findMany({
      where: {
        archived: false,
        ...(userId && { userId }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return requests.map(mapHaulingRequest);
}

/**
 * Create a new hauling request on behalf of the authenticated requester.
 */
export async function createHaulingRequest(
  data: CreateHaulingRequestInput,
  userId: string,
) {
  const request = await prisma.$transaction(async (tx) => {
    const sequence = await getNextSequence(
      tx,
      "hauling_request",
    );

    const requestNumber = generateHaulingRequestNumber(sequence);

    const created = await tx.haulingRequest.create({
      data: {
        requestNumber: requestNumber,

        userId,

        orgId: null,

        requestAddress: data.requestAddress,

        senderType: data.senderType,

        wasteType: data.wasteType,

        pickupDate: new Date(data.pickupDate),

        // Only a URL we issued for this feature is stored; anything else
        // (another site, a javascript: URL) becomes null.
        imageUrl: resolveUploadedImageUrl(data.imageUrl, "hauling-requests"),

        note: data.note ?? null,

        status: HaulingRequestStatus.PENDING,
      },
    });

    const notification = await createDirectNotification(tx, {
      userId,
      createdById: userId,
      type: HAULING_NOTIFICATION_TYPES.pending,
      title: "Hauling request submitted",
      message: `${describeRequest(created)} is pending and waiting for approval.`,
    });

    return { created, notification };
  });

  emitNotificationCreated(request.notification);

  return mapHaulingRequest(request.created);
}

/**
 * Thrown when a request exists but is no longer pending.
 * Routes turn this into a 409 rather than a 500.
 */
export class HaulingRequestNotPendingError extends Error {}

/**
 * Moves a request out of PENDING inside the caller's transaction. The status
 * check is part of the write (updateMany with status: PENDING), so when two
 * admins act at the same moment only one write matches and the other gets a
 * count of 0, instead of both passing a separate read and both sending a
 * notification. Returns null when the request does not exist.
 */
async function decidePendingRequest(
  tx: Prisma.TransactionClient,
  id: string,
  data: Prisma.HaulingRequestUpdateManyMutationInput,
  action: "approved" | "denied",
) {
  const { count } = await tx.haulingRequest.updateMany({
    where: {
      requestId: id,
      status: HaulingRequestStatus.PENDING,
    },
    data,
  });

  const request = await tx.haulingRequest.findUnique({
    where: {
      requestId: id,
    },
  });

  if (!request) {
    return null;
  }

  if (count === 0) {
    throw new HaulingRequestNotPendingError(
      `Only pending requests can be ${action}`,
    );
  }

  return request;
}

/**
 * Approve a hauling request, recording which admin approved it.
 */
export async function approveHaulingRequest(
  id: string,
  approvedBy: string,
) {
  const result = await prisma.$transaction(async (tx) => {
    const updated = await decidePendingRequest(
      tx,
      id,
      {
        status: HaulingRequestStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
      "approved",
    );

    if (!updated) {
      return null;
    }

    const created = await createDirectNotification(tx, {
      userId: updated.userId,
      createdById: approvedBy,
      type: HAULING_NOTIFICATION_TYPES.approved,
      title: "Hauling request approved",
      message: `${describeRequest(updated)} has been approved. It now appears on your schedule.`,
    });

    return { request: updated, notification: created };
  });

  if (!result) {
    return null;
  }

  emitNotificationCreated(result.notification);

  return mapHaulingRequest(result.request);
}

/**
 * Deny a hauling request
 */
export async function denyHaulingRequest(
  id: string,
  denialReason: string,
  deniedBy: string,
) {
  // Trim before checking the length: the route schema counts raw characters,
  // so a reason of six spaces passes it and would store an empty reason.
  const trimmedReason = denialReason.trim();

  if (
    trimmedReason.length < DENIAL_REASON_MIN_LENGTH ||
    trimmedReason.length > DENIAL_REASON_MAX_LENGTH
  ) {
    throw new InvalidDenialReasonError(
      `Denial reason must be between ${DENIAL_REASON_MIN_LENGTH} and ${DENIAL_REASON_MAX_LENGTH} characters`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await decidePendingRequest(
      tx,
      id,
      {
        status: HaulingRequestStatus.DENIED,
        denialReason: trimmedReason,
      },
      "denied",
    );

    if (!updated) {
      return null;
    }

    const created = await createDirectNotification(tx, {
      userId: updated.userId,
      createdById: deniedBy,
      type: HAULING_NOTIFICATION_TYPES.denied,
      title: "Hauling request denied",
      message: `${describeRequest(updated)} was denied. Reason: ${trimmedReason}`,
    });

    return { request: updated, notification: created };
  });

  if (!result) {
    return null;
  }

  emitNotificationCreated(result.notification);

  return mapHaulingRequest(result.request);
}

/**
 * Presigned upload target for a hauling request photo.
 * Shares signing and validation rules with incident reports.
 */
export async function createHaulingRequestPhotoUpload(fileType: string) {
  return createPresignedImageUpload("hauling-requests", fileType);
}
