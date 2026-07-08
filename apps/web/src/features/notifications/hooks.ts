import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  notificationsApi,
  type NotificationPayload,
  listNotifications,
  getLatestNotification,
  markNotificationRead,
  markAllNotificationsRead,
  createPickupNotification,
} from "./api";
import type { CreateNotificationInput } from "./schemas";

const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  latest: (residentId: string) => ["notifications", "latest", residentId] as const,
};

/**
 * Super Admin query — lists all system-wide announcements/alerts.
 */
export function useNotifications(type?: string, search?: string) {
  return useQuery({
    queryKey: ["notifications", type, search],
    queryFn: () => notificationsApi.getNotifications(type, search),
  });
}

/**
 * Resident query — lists all pickup notifications for the authenticated resident.
 */
export function useResidentNotifications() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.all,
    queryFn: listNotifications,
    staleTime: 10_000,
  });
}

/**
 * Super Admin mutation — create a system-wide notification.
 */
export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: NotificationPayload) => notificationsApi.createNotification(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Polls for the latest unread pickup notification every 5 seconds.
 * Fires a sonner toast when a new pickup notification arrives.
 */
export function useLatestNotificationPolling(residentId: string | undefined) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.latest(residentId ?? ""),
    queryFn: () => getLatestNotification(residentId!),
    enabled: !!residentId,
    refetchInterval: 5000,
    staleTime: 0,
    select(data) {
      return data;
    },
    gcTime: 0,
  });
}

/** Mark a single notification as read */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/** Mark all notifications read for the resident */
export function useMarkAllNotificationsRead(residentId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(residentId!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      if (residentId) {
        void qc.invalidateQueries({
          queryKey: NOTIFICATION_KEYS.latest(residentId),
        });
      }
    },
  });
}

/**
 * Driver mutation — create a pickup notification.
 * Used by both Government Driver and Eco Aide on "Mark as Picked Up" / "Waste Collected".
 */
export function useCreatePickupNotification() {
  return useMutation({
    mutationFn: (input: CreateNotificationInput) => createPickupNotification(input),
    onSuccess: () => {
      toast.success("Pickup confirmed and resident notified!");
    },
    onError: () => {
      toast.error("Failed to send pickup notification. Please try again.");
    },
  });
}
