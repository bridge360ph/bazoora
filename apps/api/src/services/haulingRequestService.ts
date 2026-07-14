import { prisma } from "@bazoora/db";
import { HaulingRequestStatus } from "@prisma/client";
import type { CreateHaulingRequestInput } from "@bazoora/shared";
import { mapHaulingRequest } from "../lib/haulingRequestMapper.js";

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
        created_at: "desc",
      },
    });

  return requests.map(mapHaulingRequest);
}

/**
 * Create a new hauling request
 */
export async function createHaulingRequest(
  data: CreateHaulingRequestInput,
) {
  const request =
    await prisma.haulingRequest.create({
      data: {
        // TODO: Replace with authenticated user
        user_id: "TEMP_USER",

        // TODO: Replace once organizations exist
        org_id: null,

        request_address: data.requestAddress,

        sender_type: data.senderType,

        waste_type: data.wasteType,

        pickup_date: new Date(data.pickupDate),

        image_url: data.imageUrl ?? null,

        note: data.note ?? null,

        status: HaulingRequestStatus.PENDING,

        // TODO: Add denial reason once UI provides input
      },
    });

  return mapHaulingRequest(request);
}

/**
 * Approve a hauling request
 */
export async function approveHaulingRequest(
  id: string,
) {
  try {
    const request =
      await prisma.haulingRequest.update({
        where: {
          request_id: id,
        },
        data: {
          status: HaulingRequestStatus.APPROVED,
          approved_at: new Date(),
        },
      });

    return mapHaulingRequest(request);
  } catch {
    return null;
  }
}

/**
 * Deny a hauling request
 */
export async function denyHaulingRequest(
  id: string,
) {
  try {
    const request =
      await prisma.haulingRequest.update({
        where: {
          request_id: id,
        },
        data: {
          status: HaulingRequestStatus.DENIED,
        },
      });

    return mapHaulingRequest(request);
  } catch {
    return null;
  }
}