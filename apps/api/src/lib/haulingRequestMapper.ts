import type { HaulingRequest as PrismaHaulingRequest } from "@prisma/client";
import type { HaulingRequest as SharedHaulingRequest } from "@bazoora/shared";

export function mapHaulingRequest(
  request: PrismaHaulingRequest,
): SharedHaulingRequest {
  return {
    requestId: request.request_id,

    userId: request.user_id,

    requestAddress: request.request_address,

    senderType:
      request.sender_type as SharedHaulingRequest["senderType"],

    wasteType: request.waste_type,

    pickupDate:
      request.pickup_date?.toISOString() ?? "",

    status: request.status,

    archived: request.archived,

    createdAt:
      request.created_at.toISOString(),

    updatedAt:
      request.updated_at.toISOString(),

    ...(request.org_id !== null && {
      orgId: request.org_id,
    }),

    ...(request.image_url !== null && {
      imageUrl: request.image_url,
    }),

    ...(request.approved_by !== null && {
      approvedBy: request.approved_by,
    }),

    ...(request.approved_at !== null && {
      approvedAt: request.approved_at.toISOString(),
    }),

    ...(request.denial_reason !== null && {
      denialReason: request.denial_reason,
    }),

    ...(request.note !== null && {
      note: request.note,
    }),
  };
}