import type { CSSProperties } from "react";
import type { TruckStatus } from "../fleet.types";

interface TruckStatusPillProps {
  status: TruckStatus;
}

export function TruckStatusPill({ status }: TruckStatusPillProps) {
  return (
    <span style={{ ...statusPillStyle, ...getTruckStatusStyle(status) }}>
      {status}
    </span>
  );
}

function getTruckStatusStyle(status: TruckStatus): CSSProperties {
  if (status === "Active") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (status === "Idle") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  return { background: "#fee2e2", color: "#b91c1c" };
}

const statusPillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 700,
};
