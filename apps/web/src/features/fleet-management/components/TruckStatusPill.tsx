import type { TruckStatus } from "../fleet.types";

interface TruckStatusPillProps {
  status: TruckStatus;
}

export function TruckStatusPill({ status }: TruckStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${getTruckStatusClass(
        status,
      )}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

function getTruckStatusClass(status: TruckStatus): string {
  if (status === "Active") {
    return "bg-green-100 text-green-700";
  }

  if (status === "Idle") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-red-100 text-red-700";
}