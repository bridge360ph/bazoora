import { apiClient } from "@/lib/api-client";
import {
  notificationSchema as pickupNotificationSchema,
  type CreateNotificationInput,
  type Notification as PickupNotification,
} from "./schemas";

export interface AdminNotification {
  id: string;
  type: string;
  audience: string;
  title: string;
  message: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  totalRecipients: number;
  totalReads: number;
  readRate: number;
}

export interface NotificationPayload {
  type: string;
  audience: string;
  title: string;
  message: string;
}

interface AdminNotificationListResponse {
  success: true;
  data: AdminNotification[];
}

interface AdminNotificationCreateResponse {
  success: true;
  data: {
    id: string;
    type: string;
    audience: string;
    title: string;
    message: string;
    createdAt: string;
    totalRecipients: number;
  };
}

interface ResidentNotification {
  receiptId: string;
  notificationId: string;
  type: string;
  audience: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
}

interface ResidentNotificationListResponse {
  success: true;
  data: ResidentNotification[];
}

export const notificationsApi = {
  async getNotifications(_type?: string, _search?: string) {
    const response =
      await apiClient.get<AdminNotificationListResponse>("/notifications");

    return response.data.data;
  },

  async createNotification(payload: NotificationPayload) {
    const response =
      await apiClient.post<AdminNotificationCreateResponse>(
        "/notifications",
        payload,
      );

    return response.data.data;
  },
};

export async function listNotifications() {
  const response =
    await apiClient.get<ResidentNotificationListResponse>(
      "/notifications/me",
    );

  return response.data.data;
}

export async function getLatestNotification(
  _residentId: string,
): Promise<PickupNotification | null> {
  return null;
}

export async function markNotificationRead(receiptId: string) {
  const response = await apiClient.patch(
    `/notifications/me/${receiptId}/read`,
  );

  return response.data;
}

export async function markAllNotificationsRead(_residentId: string) {
  const notifications = await listNotifications();
  const unread = notifications.filter(
    (notification) => notification.readAt === null,
  );

  await Promise.all(
    unread.map((notification) =>
      markNotificationRead(notification.receiptId),
    ),
  );
}

export async function createPickupNotification(
  input: CreateNotificationInput,
): Promise<PickupNotification> {
  const parsedInput = input;

  const response = await apiClient.post(
    "/notifications",
    {
      type: "Collection Notice",
      audience: "Residents",
      title: "Pickup Completed",
      message: parsedInput.message,
    },
  );

  const now = new Date().toISOString();

  return pickupNotificationSchema.parse({
    id: response.data.data.id,
    residentId: parsedInput.residentId,
    driverType: parsedInput.driverType,
    driverId: parsedInput.driverId,
    pickupLocation: parsedInput.pickupLocation,
    message: parsedInput.message,
    status: "picked_up",
    read: false,
    createdAt: now,
    updatedAt: now,
  });
}
