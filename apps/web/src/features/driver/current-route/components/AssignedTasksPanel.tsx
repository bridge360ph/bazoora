import { useNavigate } from "react-router-dom";

import { MiniTaskCard } from "./MiniTaskCard";

import type { Stop } from "../types";

interface AssignedRoute {
  id: string;
  routeNumber: number;
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  status: string;
  stops: number;
  routeType: string;
}

interface AssignedTasksPanelProps {
  stops: Stop[];
  assignedRoute: AssignedRoute | null;
  onDashboard: () => void;
}

export function AssignedTasksPanel({
  stops,
  assignedRoute,
  onDashboard,
}: AssignedTasksPanelProps) {
  const navigate = useNavigate();

  const handleViewDetails = (
    stop: Stop,
  ) => {
    if (stop.status !== "DONE") {
      return;
    }

    void navigate(
      "/driver/completed-route",
      {
        state: { stop },
      },
    );
  };

  const collectionCount =
    assignedRoute
      ? assignedRoute.stops
      : stops.length;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* HEADER */}
      <div className="border-b border-gray-100 px-[18px] pb-3 pt-[18px]">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-green-700">
          Assigned Tasks
        </div>

        <button
          type="button"
          className="mb-1 cursor-pointer text-left text-lg font-extrabold"
          onClick={onDashboard}
          title="Back to Dashboard"
        >
          {assignedRoute
            ? `Route ${String(
                assignedRoute.routeNumber,
              ).padStart(
                3,
                "0",
              )} — ${assignedRoute.name}`
            : "Daily Schedule"}
        </button>

        {assignedRoute && (
          <>
            <div className="text-xs text-gray-500">
              {assignedRoute.barangay}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
              <span>
                {assignedRoute.collectionDay}
              </span>

              <span>•</span>

              <span>
                {assignedRoute.startTime}
              </span>

              <span>•</span>

              <span>
                {assignedRoute.routeType}
              </span>
            </div>
          </>
        )}

        <div className="mt-2 text-xs opacity-55">
          {collectionCount}{" "}
          Collection
          {collectionCount !== 1
            ? "s"
            : ""}
        </div>
      </div>

      {/* TASKS */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3.5 py-2.5">
        {stops.length > 0 ? (
          stops.map((stop) => (
            <MiniTaskCard
              key={stop.stopNumber}
              stop={stop}
              isClickable={
                stop.status === "DONE"
              }
              onClick={() =>
                handleViewDetails(
                  stop,
                )
              }
            />
          ))
        ) : (
          <div className="py-6 text-center text-sm text-gray-500">
            {assignedRoute
              ? "No collection stop details available yet."
              : "No assigned collection stops."}
          </div>
        )}
      </div>
    </div>
  );
}

export default AssignedTasksPanel;

