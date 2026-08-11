import type { HaulingRequest as PrismaHaulingRequest } from "@bazoora/db";
import type { HaulingRequest as SharedHaulingRequest } from "@bazoora/shared";

export function mapHaulingRequest(
  request: PrismaHaulingRequest,
): SharedHaulingRequest {
  return {
    requestId: request.requestId,
    
    requestNumber: request.requestNumber,
  
    userId: request.userId,

    requestAddress: request.requestAddress,

    senderType: request.senderType,

    wasteType: request.wasteType,

    pickupDate:
      request.pickupDate?.toISOString() ?? "",

    status: request.status,

    archived: request.archived,

    createdAt:
      request.createdAt.toISOString(),

    updatedAt:
      request.updatedAt.toISOString(),

    ...(request.orgId !== null && {
      orgId: request.orgId,
    }),

    ...(request.imageUrl !== null && {
      imageUrl: request.imageUrl,
    }),

    ...(request.approvedBy !== null && {
      approvedBy: request.approvedBy,
    }),

    ...(request.approvedAt !== null && {
      approvedAt: request.approvedAt.toISOString(),
    }),

    ...(request.denialReason !== null && {
      denialReason: request.denialReason,
    }),

    ...(request.note !== null && {
      note: request.note,
    }),
  };
}