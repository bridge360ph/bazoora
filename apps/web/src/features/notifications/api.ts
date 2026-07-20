import { z } from "zod";
import { apiClient } from "@/lib/api-client";
import {
  notificationSchema as pickupNotificationSchema,
  type CreateNotificationInput,
  type Notification as PickupNotification,
} from "./schemas";

const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
  });

/* ── Super Admin / System Notifications ───────────────────────────────────── */

const systemNotificationTypeSchema = z.enum(["Select Type", "Info", "Alert", "Announcement"]);
const systemNotificationTargetAudienceSchema = z.enum([
  "Select Type",
  "All Users",
  "Citizens",
  "Drivers",
  "Specific Role/Organization",
]);

const systemNotificationSchema = z.object({
  id: z.string(),
  type: systemNotificationTypeSchema,
  targetAudience: systemNotificationTargetAudienceSchema,
  title: z.string().default(""),
  message: z.string().default(""),
});

const systemNotificationListSchema = envelope(z.array(systemNotificationSchema));
const systemNotificationResponseSchema = envelope(systemNotificationSchema);

export type NotificationType = z.infer<typeof systemNotificationTypeSchema>;
export type NotificationTargetAudience = z.infer<typeof systemNotificationTargetAudienceSchema>;
export type Notification = z.infer<typeof systemNotificationSchema>;
export type NotificationPayload = Omit<Notification, "id">;

export const notificationsApi = {
  getNotifications: async (type?: string, search?: string): Promise<Notification[]> => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (search) params.set("search", search);
    const query = params.toString();

    const response = await apiClient.get<unknown>(`/notifications${query ? `?${query}` : ""}`);
    return systemNotificationListSchema.parse(response.data).data;
  },

  createNotification: async (payload: NotificationPayload): Promise<Notification> => {
    const response = await apiClient.post<unknown>("/notifications/", payload);
    return systemNotificationResponseSchema.parse(response.data).data;
  },
};

/* ── Resident / Driver / Eco-Aide Real-Time Pickup Notifications ─────────── */

const pickupNotificationListSchema = envelope(z.array(pickupNotificationSchema));
const pickupNotificationSingleSchema = envelope(pickupNotificationSchema);
const pickupNotificationNullableSchema = envelope(pickupNotificationSchema.nullable());

export async function listNotifications(): Promise<PickupNotification[]> {
  const { data } = await apiClient.get<unknown>("/notifications");
  return pickupNotificationListSchema.parse(data).data;
}

export async function getLatestNotification(
  residentId: string,
): Promise<PickupNotification | null> {
  const { data } = await apiClient.get<unknown>(`/notifications/${residentId}/latest`);
  return pickupNotificationNullableSchema.parse(data).data;
}

export async function markNotificationRead(id: string): Promise<PickupNotification> {
  const { data } = await apiClient.patch<unknown>(`/notifications/${id}/read`);
  return pickupNotificationSingleSchema.parse(data).data;
}

export async function markAllNotificationsRead(residentId: string): Promise<void> {
  await apiClient.patch(`/notifications/resident/${residentId}/read-all`);
}

export async function createPickupNotification(
  input: CreateNotificationInput,
): Promise<PickupNotification> {
  const { data } = await apiClient.post<unknown>("/notifications", input);
  return pickupNotificationSingleSchema.parse(data).data;
}
