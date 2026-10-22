import { Icon } from "../../shared/icons";
import { icons } from "../../shared/iconData";

import type { Stop } from "../types";

type DestinationCardProps = {
  stop: Stop | null;
};

export function DestinationCard({
  stop,
}: DestinationCardProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="mb-2 text-[11px] font-bold tracking-wide opacity-50">
        DESTINATION POINT
      </div>

      {/* Destination Info */}
      <div className="mb-3.5 flex items-center gap-3">
        <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-green-100 text-green-800">
          <Icon
            icon={icons.bin}
            size={18}
          />
        </div>

        <div className="min-w-0">
          <div className="text-[15px] font-bold">
            {stop?.name ??
              "No destination assigned"}
          </div>

          <div className="text-xs opacity-55">
            {stop
              ? `${stop.address} • ${stop.barangay}`
              : "No collection stop available"}
          </div>
        </div>
      </div>

      {/* Destination ETA */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-[11px] font-bold tracking-wide opacity-50">
          GENERAL ETA
        </span>

        <span className="text-sm font-extrabold">
          —
        </span>
      </div>
    </div>
  );
}

export default DestinationCard;

