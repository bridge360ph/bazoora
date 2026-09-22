import type { Stop } from "../current-route/types";

interface DashboardStopItemProps {
  stop: Stop;
  onDetails: () => void;
}

function getStripClass(
  status: Stop["status"],
) {
  switch (status) {
    case "DONE":
      return "bg-green-500";

    case "NOW":
      return "bg-orange-500";

    case "UPCOMING":
    default:
      return "bg-amber-500";
  }
}

function getPillClass(
  status: Stop["status"],
) {
  switch (status) {
    case "DONE":
      return "bg-green-100 text-green-800";

    case "NOW":
      return "bg-orange-100 text-orange-800";

    case "UPCOMING":
    default:
      return "bg-amber-100 text-amber-800";
  }
}

function getStatusLabel(
  status: Stop["status"],
) {
  switch (status) {
    case "DONE":
      return "COMPLETED";

    case "NOW":
      return "IN PROGRESS";

    case "UPCOMING":
    default:
      return "PENDING";
  }
}

export function DashboardStopItem({
  stop,
  onDetails,
}: DashboardStopItemProps) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 py-3.5">
      <div
        className={`w-1 self-stretch rounded ${getStripClass(
          stop.status,
        )}`}
      />

      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold opacity-45">
          STOP {stop.stopNumber}
        </div>

        <div className="truncate text-sm font-semibold">
          {stop.name}
        </div>

        <div className="truncate text-xs opacity-60">
          {stop.address} • {stop.barangay}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <div
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getPillClass(
            stop.status,
          )}`}
        >
          {getStatusLabel(stop.status)}
        </div>

        <button
          type="button"
          onClick={onDetails}
          className="cursor-pointer text-xs font-bold opacity-70 hover:opacity-100"
        >
          Details ›
        </button>
      </div>
    </div>
  );
}

export default DashboardStopItem;

