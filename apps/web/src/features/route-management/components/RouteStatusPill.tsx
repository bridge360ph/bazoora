import type { RouteStatus } from "../route.types";

const statusStyles: Record<RouteStatus, string> = {
  "In Progress": "bg-[#fef3c7] text-[#92400e] border border-[#fbbf24]",
  Completed: "bg-[#dcfce7] text-[#166534] border border-[#4ade80]",
  "Not Started": "bg-[#fee2e2] text-[#9a3412] border border-[#f87171]",
};

interface RouteStatusPillProps {
  status: RouteStatus;
}

export function RouteStatusPill({ status }: RouteStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-0.5 text-xs font-bold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
