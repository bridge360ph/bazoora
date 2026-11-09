import type { Route } from "@bazoora/shared";
import { CalendarClock, MapPin, Truck, UserRound } from "lucide-react";

import { AdminListCard, AdminMeta } from "@/components/admin/AdminListCard";
import { AdminPill, BUTTON_CLASSES } from "@/components/admin/AdminControls";
import { RouteStatusPill } from "./RouteStatusPill";
import { formatAssignedEcoAide } from "../formatAssignedEcoAide";
import { describeRouteSchedule, formatStartTime } from "../route.types";
import { formatWasteType } from "../routeFilters.constants";
import { formatTruckOption } from "../../route-assignment/routeAssignmentApi";

interface RouteCardProps {
  route: Route;
  onEdit: () => void;
  onAssign: () => void;
  onAssignTruck: () => void;
  onView: () => void;
  onDelete: () => void;
}

const STATUS_ACCENT: Record<Route["status"], string> = {
  "Not Started": "border-l-orange-400",
  "In Progress": "border-l-amber-400",
  Completed: "border-l-emerald-400",
};

export function RouteCard({ route, onEdit, onAssign, onAssignTruck, onView, onDelete }: RouteCardProps) {
  return (
    <AdminListCard
      accentClassName={STATUS_ACCENT[route.status]}
      onOpen={onView}
      aside={
        <>
          <RouteStatusPill status={route.status} />
          <div className="flex flex-wrap items-center justify-end gap-1">
            <button type="button" onClick={onEdit} className={BUTTON_CLASSES.link}>
              Edit
            </button>
            <button type="button" onClick={onAssign} className={BUTTON_CLASSES.link}>
              Eco-Aide
            </button>
            <button type="button" onClick={onAssignTruck} className={BUTTON_CLASSES.link}>
              Truck
            </button>
            <button type="button" onClick={onDelete} className={BUTTON_CLASSES.linkDanger}>
              Delete
            </button>
          </div>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm font-bold text-gray-800">{route.name}</p>
        <AdminPill
          className={
            route.routeType === "Paid"
              ? "border border-amber-200 bg-amber-50 text-amber-700"
              : "border border-surface-border text-surface-muted"
          }
        >
          {route.routeType === "Paid" ? "Paid" : "Free"}
        </AdminPill>
        <AdminPill>{formatWasteType(route.wasteType)}</AdminPill>
      </div>

      <p className="mt-0.5 text-[10px] text-gray-500">ID: {route.routeDisplayNumber}</p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
        <AdminMeta icon={<CalendarClock className="h-3 w-3 shrink-0 text-gray-400" />}>
          {describeRouteSchedule(route)} · {formatStartTime(route.startTime)}
        </AdminMeta>
        <AdminMeta icon={<MapPin className="h-3 w-3 shrink-0 text-gray-400" />}>
          {route.barangay} · {route.stops} {route.stops === 1 ? "stop" : "stops"}
        </AdminMeta>
        <AdminMeta icon={<UserRound className="h-3 w-3 shrink-0 text-gray-400" />}>
          {formatAssignedEcoAide(route.assignedEcoAide)}
        </AdminMeta>
        <AdminMeta icon={<Truck className="h-3 w-3 shrink-0 text-gray-400" />}>
          {route.assignedTruck ? formatTruckOption(route.assignedTruck) : "No truck yet"}
        </AdminMeta>
      </div>
    </AdminListCard>
  );
}
