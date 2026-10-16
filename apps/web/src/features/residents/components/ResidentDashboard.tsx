import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin, Truck } from "lucide-react";
import type { HaulingRequest } from "@bazoora/shared";

import { listMyHaulingRequests } from "@/features/hauling-requests/api";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useResidentNotifications,
} from "@/features/notifications/hooks";
import { useAuthStore } from "@/stores/auth-store";

import { WASTE_TYPE_LABELS } from "./hauling-requests/constants";
import { splitPickupAddresses } from "./hauling-requests/utils";

const NOTIFICATIONS_LIMIT = 20;
// Denied requests stay on the dashboard this long so the resident sees the reason.
const RECENT_DENIAL_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const HISTORY_LINK = "/resident/hauling-requests?tab=history";

function toTime(value: string | undefined): number {
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isNaN(time) ? 0 : time;
}

function formatCollectionDate(value: string): string {
  const date = new Date(value);
  const day = date.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const time = date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

export function ResidentDashboard(): ReactNode {
  const user = useAuthStore((s) => s.user);

  const [requests, setRequests] = useState<HaulingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const notificationsQuery = useResidentNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead(user?.id);

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      try {
        const data = await listMyHaulingRequests();
        if (!cancelled) setRequests(data);
      } catch (loadError) {
        // The collection card and counts fall back to their empty states.
        console.error("Failed to load hauling requests:", loadError);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRequests();
    return () => {
      cancelled = true;
    };
  }, []);

  const notifications = (notificationsQuery.data ?? []).slice(0, NOTIFICATIONS_LIMIT);
  const unreadCount = (notificationsQuery.data ?? []).filter(
    (notification) => notification.readAt === null,
  ).length;

  const { nextCollection, counts } = useMemo(() => {
    const now = Date.now();
    const active = requests.filter((request) => !request.archived);

    const isRecentDenial = (request: HaulingRequest) =>
      request.status === "DENIED" &&
      now - toTime(request.updatedAt ?? request.createdAt) <= RECENT_DENIAL_WINDOW_MS;

    const upcomingApproved = active
      .filter(
        (request) =>
          request.status === "APPROVED" && toTime(request.pickupDate) >= now,
      )
      .sort((a, b) => toTime(a.pickupDate) - toTime(b.pickupDate));

    return {
      nextCollection: upcomingApproved[0] ?? null,
      counts: {
        pending: active.filter((request) => request.status === "PENDING").length,
        approved: upcomingApproved.length,
        denied: active.filter(isRecentDenial).length,
      },
    };
  }, [requests]);

  const address = user?.address;
  const addressLine = address
    ? [address.line1, address.barangay, address.city, address.province]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    // The resident layout's content panel doesn't scroll, so the page scrolls itself.
    <div className="h-full overflow-y-auto bg-[#f3f5f4] px-8 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <NextCollectionCard
          loading={loading}
          request={nextCollection}
        />

        {/* Request status summary */}
        <section className="grid gap-4 sm:grid-cols-3">
          <StatusCount
            label="Pending approval"
            hint="Waiting for the hauling team"
            count={counts.pending}
            loading={loading}
            accentClass="border-l-orange-400"
            countClass="text-orange-700"
          />
          <StatusCount
            label="Approved"
            hint="Upcoming collections"
            count={counts.approved}
            loading={loading}
            accentClass="border-l-emerald-400"
            countClass="text-emerald-700"
          />
          <StatusCount
            label="Denied"
            hint="In the last 14 days"
            count={counts.denied}
            loading={loading}
            accentClass="border-l-red-400"
            countClass="text-red-700"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Notifications: hauling request updates plus any other alerts */}
          <section className="flex min-h-64 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white px-7 py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="text-xs font-semibold text-gray-500 hover:text-brand-dark disabled:opacity-50"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Capped height so the card stays inside its border; extra rows scroll. */}
            <div className="mt-5 flex max-h-80 min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
              {notificationsQuery.isLoading ? (
                Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="h-16 shrink-0 animate-pulse rounded-md border border-gray-100 bg-gray-50"
                  />
                ))
              ) : notificationsQuery.isError ? (
                <EmptyState>
                  We couldn&apos;t load your notifications. Please try again later.
                </EmptyState>
              ) : notifications.length === 0 ? (
                <EmptyState>
                  No notifications yet. Updates on your hauling requests will
                  appear here.
                </EmptyState>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.receiptId}
                    notification={notification}
                    onSelect={() => {
                      if (notification.readAt === null) {
                        markRead.mutate(notification.receiptId);
                      }
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {/* Locations */}
          <div className="space-y-4">
            <section className="flex min-h-32 items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-7 py-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-800">Your Location</h2>
                <p className="mt-2 max-w-90 text-sm leading-5 text-gray-500">
                  {addressLine || (
                    <span className="text-gray-400">
                      No address saved yet. Add one in Settings.
                    </span>
                  )}
                </p>
              </div>

              <Link
                to="/resident/settings"
                className="shrink-0 rounded-md bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {addressLine ? "Change" : "Add"}
              </Link>
            </section>

            <section className="flex min-h-32 items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-7 py-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-800">Truck Location</h2>
                <p className="mt-2 text-sm text-gray-500">
                  See where the collection truck is on the map.
                </p>
              </div>

              <Link
                to="/resident/track"
                className="flex shrink-0 items-center gap-2 rounded-md border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Truck className="h-4 w-4" />
                Track
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function NextCollectionCard({
  loading,
  request,
}: {
  loading: boolean;
  request: HaulingRequest | null;
}): ReactNode {
  if (loading) {
    return (
      <section className="rounded-xl bg-brand-dark px-8 py-8 text-white">
        <p className="text-xs font-medium tracking-wide text-gray-300">
          NEXT SCHEDULED COLLECTION
        </p>
        <div className="mt-4 h-9 w-80 max-w-full animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-5 w-56 max-w-full animate-pulse rounded bg-white/10" />
      </section>
    );
  }

  if (!request) {
    return (
      <section className="rounded-xl bg-brand-dark px-8 py-8 text-white">
        <p className="text-xs font-medium tracking-wide text-gray-300">
          NEXT SCHEDULED COLLECTION
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight">
          No upcoming collection
        </h1>
        <p className="mt-2 max-w-xl text-base text-gray-300">
          Once a hauling request is approved, its pickup date will show here.
        </p>
        <Link
          to="/resident/hauling-requests"
          className="mt-8 inline-flex rounded-md bg-brand-accent px-7 py-3 text-sm font-semibold text-brand-dark transition hover:opacity-90"
        >
          Request a Pickup →
        </Link>
      </section>
    );
  }

  const [firstStop, ...otherStops] = splitPickupAddresses(request.requestAddress);

  return (
    <section className="rounded-xl bg-brand-dark px-8 py-8 text-white">
      <p className="text-xs font-medium tracking-wide text-gray-300">
        NEXT SCHEDULED COLLECTION
      </p>

      <h1 className="mt-4 text-3xl font-bold leading-tight">
        {formatCollectionDate(request.pickupDate)}
      </h1>

      <p className="mt-2 flex items-center gap-1.5 text-base text-gray-300">
        <MapPin className="h-4 w-4 shrink-0" />
        <span className="truncate">{firstStop}</span>
        {otherStops.length > 0 && (
          <span className="shrink-0 text-gray-400">
            +{otherStops.length} more stop{otherStops.length > 1 ? "s" : ""}
          </span>
        )}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-200">
          {WASTE_TYPE_LABELS[request.wasteType]}
        </span>
        <span className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-200">
          {request.requestNumber}
        </span>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/resident/schedule"
          className="inline-flex rounded-md bg-brand-accent px-7 py-3 text-sm font-semibold text-brand-dark transition hover:opacity-90"
        >
          View Schedule →
        </Link>
        <Link
          to="/resident/track"
          className="inline-flex rounded-md border border-white/30 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Track Truck
        </Link>
      </div>
    </section>
  );
}

function StatusCount({
  label,
  hint,
  count,
  loading,
  accentClass,
  countClass,
}: {
  label: string;
  hint: string;
  count: number;
  loading: boolean;
  accentClass: string;
  countClass: string;
}): ReactNode {
  return (
    <Link
      to={HISTORY_LINK}
      className={`group rounded-xl border border-l-4 border-gray-200 bg-white px-6 py-5 transition hover:shadow-sm ${accentClass}`}
    >
      <p className="text-xs font-semibold tracking-wide text-gray-500">
        {label.toUpperCase()}
      </p>
      <p className={`mt-2 text-3xl font-bold ${countClass}`}>
        {loading ? "–" : count}
      </p>
      <p className="mt-1 text-xs text-gray-400">{hint}</p>
    </Link>
  );
}

function EmptyState({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
      <p>{children}</p>
    </div>
  );
}
