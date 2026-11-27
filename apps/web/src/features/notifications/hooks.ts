import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  notificationsApi,
  type NotificationPayload,
  type ResidentNotification,
  listNotifications,
  getLatestNotification,
  markNotificationRead,
  markAllNotificationsRead,
  createPickupNotification,
} from "./api";
import type { CreateNotificationInput } from "./schemas";
import { useAuthStore } from "@/stores/auth-store";

const NOTIFICATION_KEYS = {
  all: ["notifications"] as const,
  /** Every user's "my notifications" list (keyed further by user id). */
  mine: ["notifications", "me"] as const,
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
  // Keyed by user so switching accounts never shows the previous user's list,
  // and disabled while signed out so it can't trigger a token refresh.
  const userId = useAuthStore((state) => state.user?.id);

  return useQuery({
    queryKey: [...NOTIFICATION_KEYS.mine, userId ?? ""],
    queryFn: listNotifications,
    enabled: Boolean(userId),
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

type ListSnapshot = [QueryKey, ResidentNotification[] | undefined][];

/**
 * Marks matching notifications as read in every cached "my notifications"
 * list right away, so badges and dots clear on click instead of after the
 * server answers. Returns the previous lists so a failure can put them back.
 */
async function markReadInCache(
  qc: QueryClient,
  shouldMark: (notification: ResidentNotification) => boolean,
): Promise<ListSnapshot> {
  // Stop an in-flight refetch from overwriting the optimistic change.
  await qc.cancelQueries({ queryKey: NOTIFICATION_KEYS.mine });

  const snapshot = qc.getQueriesData<ResidentNotification[]>({
    queryKey: NOTIFICATION_KEYS.mine,
  });
  const readAt = new Date().toISOString();

  qc.setQueriesData<ResidentNotification[]>(
    { queryKey: NOTIFICATION_KEYS.mine },
    (list) =>
      list?.map((notification) =>
        notification.readAt === null && shouldMark(notification)
          ? { ...notification, readAt }
          : notification,
      ),
  );

  return snapshot;
}

function restoreCache(qc: QueryClient, snapshot: ListSnapshot | undefined) {
  for (const [queryKey, list] of snapshot ?? []) {
    qc.setQueryData(queryKey, list);
  }
}

/** Mark a single notification as read. The UI updates immediately and rolls back if the server fails. */
export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (receiptId: string) => ({
      snapshot: await markReadInCache(
        qc,
        (notification) => notification.receiptId === receiptId,
      ),
    }),
    onError: (_error, _receiptId, context) => {
      restoreCache(qc, context?.snapshot);
      toast.error("Couldn't mark the notification as read. Please try again.");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/** Mark all notifications read for the resident. The UI updates immediately and rolls back if the server fails. */
export function useMarkAllNotificationsRead(residentId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(residentId!),
    onMutate: async () => ({
      snapshot: await markReadInCache(qc, () => true),
    }),
    onError: (error, _variables, context) => {
      restoreCache(qc, context?.snapshot);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Couldn't mark notifications as read. Please try again.",
      );
    },
    // Refresh on failure too: some notifications may have been marked.
    onSettled: () => {
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
