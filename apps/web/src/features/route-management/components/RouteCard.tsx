import type { Route } from "../../../types/route.types";
import { RouteStatusPill } from "./RouteStatusPill";

interface RouteCardProps {
  route: Route;
  onEdit: () => void;
  onAssign: () => void;
  onView: () => void;
}

export function RouteCard({ route, onEdit, onAssign, onView }: RouteCardProps) {
  return (
    <article className="mb-3 rounded-xl bg-[#1a3a2e] p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">{route.name}</h2>
          <p className="mt-0.5 text-xs text-white/60">
            Route {route.routeNumber} ({route.id}) - Eco-Aide: {route.ecoAide}
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
          className="rounded-md bg-[#4ade80] px-3.5 py-1.5 text-xs font-semibold text-[#1a3a2e]"
        >
          Edit Route
        </button>

        <button
          type="button"
          onClick={onAssign}
          className="rounded-md bg-[#4ade80] px-3.5 py-1.5 text-xs font-semibold text-[#1a3a2e]"
        >
          Assign Eco-Aide
        </button>

        <button
          type="button"
          onClick={onView}
          className="rounded-md bg-[#4ade80] px-3.5 py-1.5 text-xs font-semibold text-[#1a3a2e]"
        >
          View Details
        </button>
      </div>
    </article>
  );
}
