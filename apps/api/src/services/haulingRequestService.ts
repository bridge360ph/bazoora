import { prisma } from "@bazoora/db";
import { HaulingRequestStatus } from "@prisma/client";
import type { CreateHaulingRequestInput } from "@bazoora/shared";
import { mapHaulingRequest } from "../lib/haulingRequestMapper.js";
import { generateHaulingRequestNumber } from "../lib/displayId.js";
import { getNextSequence } from "../lib/counter.js";

/**
 * Get all hauling requests
 */
export async function getHaulingRequests() {
  const requests =
    await prisma.haulingRequest.findMany({
      where: {
        archived: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return requests.map(mapHaulingRequest);
}

/**
 * Create a new hauling request
 */
/**
 * Create a new hauling request
 */
export async function createHaulingRequest(
  data: CreateHaulingRequestInput,
) {
  const request = await prisma.$transaction(async (tx) => {
    const sequence = await getNextSequence(
      tx,
      "hauling_request",
    );

    const requestNumber = generateHaulingRequestNumber(sequence);

    return tx.haulingRequest.create({
      data: {
        requestNumber: requestNumber,

        // TODO: Replace with authenticated user
        userId: "TEMP_USER",

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
  });

  return mapHaulingRequest(request);
}

/**
 * Approve a hauling request
 */
export async function approveHaulingRequest(
  id: string,
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

  const request =
    await prisma.haulingRequest.update({
      where: {
        requestId: id,
      },
      data: {
        status: HaulingRequestStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

  return mapHaulingRequest(request);
}

/**
 * Deny a hauling request
 */
export async function denyHaulingRequest(
  id: string,
  denialReason: string,
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

  const request =
    await prisma.haulingRequest.update({
      where: {
        requestId: id,
      },
      data: {
        status: HaulingRequestStatus.DENIED,
        denialReason: trimmedReason,
      },
    });

  return mapHaulingRequest(request);
}