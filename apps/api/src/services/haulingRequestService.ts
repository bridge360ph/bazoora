import type {
  CreateHaulingRequestInput,
  HaulingRequest,
} from "@bazoora/shared";

// TODO: replace with @bazoora/db queries once the HaulingRequest model lands (#44)
const haulingRequests: HaulingRequest[] = [];

/**
 * Get all hauling requests (mock in-memory)
 */
export function getHaulingRequests() {
  return haulingRequests;
}

/**
 * Create a new hauling request (mock in-memory)
 */
export function createHaulingRequest(
  data: CreateHaulingRequestInput,
) {
  const request: HaulingRequest = {
    requestId: crypto.randomUUID(),
    requestAddress: data.requestAddress,
    senderType: data.senderType,
    pickupDate: data.pickupDate,
    status: "pending",

    ...(data.imageUrl !== undefined && {
      imageUrl: data.imageUrl,
    }),

    ...(data.note !== undefined && {
      note: data.note,
    }),
  };

  haulingRequests.push(request);

  return request;
}

/**
 * Approve a hauling request
 */
export function approveHaulingRequest(id: string) {
  const request = haulingRequests.find(
    (item) => item.requestId === id,
  );

  if (!request) {
    return null;
  }

  request.status = "approved";
  return request;
}

/**
 * Deny a hauling request
 */
export function denyHaulingRequest(id: string) {
  const request = haulingRequests.find(
    (item) => item.requestId === id,
  );

  if (!request) {
    return null;
  }

  request.status = "denied";
  return request;
}