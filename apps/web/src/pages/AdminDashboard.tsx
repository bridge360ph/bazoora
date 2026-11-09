import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import type { HaulingRequest, Route } from "@bazoora/shared";
import { CalendarClock, ChevronRight, MapPin } from "lucide-react";

import { AdminPage, AdminPanel, AdminPanelHeader } from "@/components/admin/AdminPage";
import { AdminEmptySlot, AdminStat, BUTTON_CLASSES } from "@/components/admin/AdminControls";
import { getAnalyticsOverview } from "@/features/analytics/api";
import { useHaulingRequests } from "@/features/hauling-requests/hooks/useHaulingRequests";
import { HaulingStatusBadge } from "@/features/hauling-requests/components/HaulingStatusBadge";
import {
  WASTE_TYPE_DISPLAY,
} from "@/features/hauling-requests/haulingRequestManagement.constants";
import {
  formatDateTime,
  getPickupAddresses,
} from "@/features/hauling-requests/haulingRequestFormat";
import { useRoutes } from "@/features/route-management/hooks/useRoutes";
import { RouteStatusPill } from "@/features/route-management/components/RouteStatusPill";
import { describeRouteSchedule, formatStartTime } from "@/features/route-management/route.types";

const REVIEW_LIMIT = 5;
const ROUTE_STATUSES: Route["status"][] = ["Not Started", "In Progress", "Completed"];

/**
 * Admin home: what needs attention now. Built from the same data as the
 * Hauling Requests, Route Management and Analytics pages.
 */
export function AdminDashboard() {
  const {
    data: requests = [],
    isLoading: requestsLoading,
    isError: requestsFailed,
    refetch: refetchRequests,
  } = useHaulingRequests();
  const {
    data: routes = [],
    isLoading: routesLoading,
    isError: routesFailed,
    refetch: refetchRoutes,
  } = useRoutes();
  const {
    data: overview,
    isError: overviewFailed,
    refetch: refetchOverview,
  } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: getAnalyticsOverview,
  });
  // A failed load shows a dash and an error, never a zero that reads as
  // "nothing to do".
  const requestsUnknown = requestsLoading || requestsFailed;
  const routesUnknown = routesLoading || routesFailed;

  const active = requests.filter((request) => !request.archived);
  const pending = active
    .filter((request) => request.status === "PENDING")
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  const approvedWithoutRoute = active.filter(
    (request) => request.status === "APPROVED" && !request.routeId,
  ).length;
  const inProgressRoutes = routes.filter((route) => route.status === "In Progress");

  return (
    <AdminPage>
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <AdminStat
          label="Pending Requests"
          value={requestsUnknown ? "-" : pending.length}
          hint={requestsFailed ? "Could not load requests" : "Waiting for a feasibility check"}
        />
        <AdminStat
          label="Approved, No Route"
          value={requestsUnknown ? "-" : approvedWithoutRoute}
          hint={requestsFailed ? "Could not load requests" : "Approved requests not on a route yet"}
        />
        <AdminStat
          label="Routes In Progress"
          value={routesUnknown ? "-" : inProgressRoutes.length}
          hint={
            routesFailed
              ? "Could not load routes"
              : routesLoading
                ? undefined
                : `${routes.length} routes in total`
          }
        />
        <AdminStat
          label="Trucks Assigned"
          value={overview ? `${overview.totals.assignedTrucks} / ${overview.totals.trucks}` : "-"}
          hint={
            overview
              ? `${overview.totals.ecoAides} Eco-Aides`
              : overviewFailed
                ? "Could not load the fleet"
                : undefined
          }
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminPanel className="xl:col-span-2">
          <AdminPanelHeader
            eyebrow="HAULING REQUESTS"
            title="Needs review"
            description="Oldest pending requests first."
            actions={<ViewAll to="/admin/hauling" />}
          />
          <div className="flex flex-col gap-3 p-5">
            {requestsLoading ? (
              <AdminEmptySlot>Loading requests...</AdminEmptySlot>
            ) : requestsFailed ? (
              <LoadError
                what="hauling requests"
                onRetry={() => {
                  void refetchRequests();
                }}
              />
            ) : pending.length === 0 ? (
              <AdminEmptySlot>No pending requests. You&apos;re all caught up.</AdminEmptySlot>
            ) : (
              pending.slice(0, REVIEW_LIMIT).map((request) => (
                <RequestRow key={request.requestId} request={request} />
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            eyebrow="ROUTES"
            title="Route status"
            actions={<ViewAll to="/admin/routes" />}
          />
          <div className="flex flex-col gap-2 p-5">
            {routesFailed && <LoadError what="routes" onRetry={refetchRoutes} />}
            {ROUTE_STATUSES.map((status) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3"
              >
                <RouteStatusPill status={status} />
                <span className="text-lg font-bold text-gray-800">
                  {routesUnknown ? "-" : routes.filter((route) => route.status === status).length}
                </span>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <AdminPanel className="xl:col-span-2">
          <AdminPanelHeader
            eyebrow="ROUTES"
            title="In progress now"
            actions={<ViewAll to="/admin/routes" />}
          />
          <div className="flex flex-col gap-3 p-5">
            {routesLoading ? (
              <AdminEmptySlot>Loading routes...</AdminEmptySlot>
            ) : routesFailed ? (
              <LoadError what="routes" onRetry={refetchRoutes} />
            ) : inProgressRoutes.length === 0 ? (
              <AdminEmptySlot>No routes are running right now.</AdminEmptySlot>
            ) : (
              inProgressRoutes.slice(0, REVIEW_LIMIT).map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between gap-4 rounded-md border border-l-2 border-gray-200 border-l-amber-400 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-800">{route.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-600">
                      <CalendarClock className="h-3 w-3 shrink-0 text-gray-400" />
                      {describeRouteSchedule(route)} · {formatStartTime(route.startTime)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-gray-500">{route.routeDisplayNumber}</span>
                </div>
              ))
            )}
          </div>
        </AdminPanel>

        <AdminPanel>
          <AdminPanelHeader
            eyebrow="ECO-AIDES"
            title="Availability"
            actions={<ViewAll to="/admin/eco-aides" />}
          />
          <div className="flex flex-col gap-2 p-5">
            {overviewFailed ? (
              <LoadError
                what="Eco-Aides"
                onRetry={() => {
                  void refetchOverview();
                }}
              />
            ) : !overview ? (
              <AdminEmptySlot>Loading Eco-Aides...</AdminEmptySlot>
            ) : overview.ecoAideAvailability.length === 0 ? (
              <AdminEmptySlot>No Eco-Aides yet.</AdminEmptySlot>
            ) : (
              overview.ecoAideAvailability.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-4 py-3 text-xs text-gray-700"
                >
                  {entry.name}
                  <span className="text-lg font-bold text-gray-800">{entry.value}</span>
                </div>
              ))
            )}
          </div>
        </AdminPanel>
      </div>
    </AdminPage>
  );
}

/** Shown instead of an empty list when a section failed to load. */
function LoadError({ what, onRetry }: { what: string; onRetry: () => void }): ReactNode {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-4 text-center text-xs text-red-700"
    >
      Couldn&apos;t load {what}.
      <button type="button" onClick={onRetry} className={BUTTON_CLASSES.ghost}>
        Retry
      </button>
    </div>
  );
}

function ViewAll({ to }: { to: string }): ReactNode {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
    >
      View all
      <ChevronRight className="h-3 w-3" />
    </Link>
  );
}

function RequestRow({ request }: { request: HaulingRequest }): ReactNode {
  const [firstPickup, ...otherPickups] = getPickupAddresses(request.requestAddress);

  return (
    <Link
      to="/admin/hauling"
      className="group flex items-center justify-between gap-4 rounded-md border border-l-2 border-gray-200 border-l-orange-400 px-5 py-3 transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-800">{WASTE_TYPE_DISPLAY[request.wasteType]}</p>
        <p className="mt-0.5 text-[10px] text-gray-500">ID: {request.requestNumber}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
            <span className="truncate">{firstPickup}</span>
            {otherPickups.length > 0 && (
              <span className="shrink-0 text-gray-400">+{otherPickups.length} more</span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <CalendarClock className="h-3 w-3 text-gray-400" />
            Preferred {formatDateTime(request.pickupDate)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <HaulingStatusBadge status={request.status} />
        <span className="flex items-center text-[11px] font-semibold text-brand-secondary group-hover:text-brand-dark">
          Review
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
