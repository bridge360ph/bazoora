import type { TruckStatus } from "../fleet.types";

interface TruckStatusPillProps {
  status: TruckStatus;
}

export function TruckStatusPill({ status }: TruckStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[999px] px-[10px] py-[3px] text-[11px] font-bold ${getTruckStatusClass(
        status,
      )}`}
    >
      {status}
    </span>
  );
}

function getTruckStatusClass(status: TruckStatus): string {
  if (status === "Active") {
    return "bg-green-100 text-green-800";
  }

  if (status === "Idle") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-red-100 text-red-700";
}