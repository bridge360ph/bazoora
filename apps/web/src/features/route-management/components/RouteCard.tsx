import type { Route } from "@bazoora/shared";
import { RouteStatusPill } from "./RouteStatusPill";
import { formatAssignedEcoAide } from "../formatAssignedEcoAide";
import { formatTruckOption } from "../../route-assignment/routeAssignmentApi";

interface RouteCardProps {
  route: Route;
  onEdit: () => void;
  onAssign: () => void;
  onAssignTruck: () => void;
  onView: () => void;
  onDelete: () => void;
}

export function RouteCard({
  route,
  onEdit,
  onAssign,
  onAssignTruck,
  onView,
  onDelete,
}: RouteCardProps) {
  return (
    <article className="mb-3 rounded-xl bg-brand-dark p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">{route.name}</h2>
          <p className="mt-0.5 text-xs text-white/60">
            Route {route.routeDisplayNumber}
            {" • "}
            Eco-Aide: {formatAssignedEcoAide(route.assignedEcoAide)}
            {" • "}
            Truck:{" "}
            {route.assignedTruck
              ? formatTruckOption(route.assignedTruck)
              : "Unassigned"}
          </p>
        </div>

        <RouteStatusPill status={route.status} />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-medium text-white">
          {route.collectionDay}
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-medium text-white">
          {route.startTime}
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-medium text-white">
          {route.wasteType}
        </span>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11.5px] font-medium text-white">
          {route.stops} Stops
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="cursor-pointer rounded-md bg-brand-accent px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:opacity-90"
        >
          Edit Route
        </button>

        <button
          type="button"
          onClick={onAssign}
          className="cursor-pointer rounded-md bg-brand-accent px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:opacity-90"
        >
          Assign Eco-Aide
        </button>

        <button
          type="button"
          onClick={onAssignTruck}
          className="cursor-pointer rounded-md bg-brand-accent px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:opacity-90"
        >
          Assign Truck
        </button>

        <button
          type="button"
          onClick={onView}
          className="cursor-pointer rounded-md bg-brand-accent px-3.5 py-1.5 text-xs font-semibold text-brand transition hover:opacity-90"
        >
          View Details
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="cursor-pointer rounded-md border border-white/30 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:border-red-300 hover:bg-red-500/20 hover:text-red-100"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
