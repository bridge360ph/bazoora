import { prisma } from "@bazoora/db";
import { HaulingRequestStatus } from "@prisma/client";
import type { CreateHaulingRequestInput } from "@bazoora/shared";
import { mapHaulingRequest } from "../lib/haulingRequestMapper.js";
import { generateHaulingRequestNumber } from "../lib/displayId.js";
import { getNextSequence } from "../lib/counter.js";
import {
  HAULING_NOTIFICATION_TYPES,
  createDirectNotification,
  emitNotificationCreated,
} from "../lib/userNotifications.js";

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

        imageUrl: data.imageUrl ?? null,

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
 * Approve a hauling request, recording which admin approved it.
 */
export async function approveHaulingRequest(
  id: string,
  approvedBy: string,
) {
  const existing =
    await prisma.haulingRequest.findUnique({
      where: {
        requestId: id,
      },
    });

  if (!existing) {
    return null;
  }

  if (existing.status !== HaulingRequestStatus.PENDING) {
    throw new Error(
      "Only pending requests can be approved",
    );
  }

  const { request, notification } = await prisma.$transaction(async (tx) => {
    const updated = await tx.haulingRequest.update({
      where: {
        requestId: id,
      },
      data: {
        status: HaulingRequestStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    const created = await createDirectNotification(tx, {
      userId: updated.userId,
      createdById: approvedBy,
      type: HAULING_NOTIFICATION_TYPES.approved,
      title: "Hauling request approved",
      message: `${describeRequest(updated)} has been approved. It now appears on your schedule.`,
    });

    return { request: updated, notification: created };
  });

  emitNotificationCreated(notification);

  return mapHaulingRequest(request);
}

/**
 * Deny a hauling request
 */
export async function denyHaulingRequest(
  id: string,
  denialReason: string,
  deniedBy: string,
) {
  const existing =
    await prisma.haulingRequest.findUnique({
      where: {
        requestId: id,
      },
    });

  if (!existing) {
    return null;
  }

  if (existing.status !== HaulingRequestStatus.PENDING) {
    throw new Error(
      "Only pending requests can be denied",
    );
  }

  const trimmedReason = denialReason.trim();

  if (trimmedReason.length > 500) {
    throw new Error(
      "Denial reason must not exceed 500 characters",
    );
  }

  const { request, notification } = await prisma.$transaction(async (tx) => {
    const updated = await tx.haulingRequest.update({
      where: {
        requestId: id,
      },
      data: {
        status: HaulingRequestStatus.DENIED,
        denialReason: trimmedReason,
      },
    });

    const created = await createDirectNotification(tx, {
      userId: updated.userId,
      createdById: deniedBy,
      type: HAULING_NOTIFICATION_TYPES.denied,
      title: "Hauling request denied",
      message: `${describeRequest(updated)} was denied. Reason: ${trimmedReason}`,
    });

    return { request: updated, notification: created };
  });

  emitNotificationCreated(notification);

  return mapHaulingRequest(request);
}