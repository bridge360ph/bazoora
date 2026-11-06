import type { RouteStatus } from "@bazoora/shared";

const statusStyles: Record<RouteStatus, string> = {
  "Not Started": "bg-orange-100 text-orange-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
};

interface RouteStatusPillProps {
  status: RouteStatus;
}

export function RouteStatusPill({ status }: RouteStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${statusStyles[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
}
