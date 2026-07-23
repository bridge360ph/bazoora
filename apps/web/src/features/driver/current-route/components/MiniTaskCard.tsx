import { Icon } from "../../shared/icons";
import { icons } from "../../shared/iconData";
import type { Stop, StopStatus } from "../types";

const statusBadgeClass: Record<StopStatus, string> = {
  DONE: "bg-green-100 text-green-800",
  NOW: "bg-white text-[#0f2a1f]",
  IN_PROGRESS: "bg-orange-100 text-orange-800",
  UPCOMING: "bg-gray-100 text-slate-600",
};

export function MiniTaskCard({
  stop,
}: {
  stop: Stop;
}) {
  const isNow = stop.status === "NOW";
  const isCritical = stop.priority === "Critical";
  const isHazardous = stop.wasteType === "Hazardous";

  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-2 ${
        isNow
          ? "bg-[#0f2a1f] border-[#0f2a1f] text-white"
          : "bg-white border-gray-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div
          className={`w-[26px] h-[26px] rounded-full text-[11px] font-bold flex items-center justify-center flex-shrink-0 ${
            isNow
              ? "bg-green-400 text-[#0f2a1f]"
              : "bg-gray-200 text-slate-600"
          }`}
        >
          {stop.stopNumber}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div
              className={`text-sm font-bold ${
                isNow ? "text-white" : "text-slate-900"
              }`}
            >
              {stop.name}
            </div>

            <div
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${statusBadgeClass[stop.status]}`}
            >
              {stop.status === "NOW" && (
                <Icon icon={icons.bookmark} size={10} />
              )}

              {stop.statusLabel ?? stop.status}
            </div>
          </div>

          <div
            className={`text-[11px] mt-0.5 ${
              isNow ? "text-white/70" : "opacity-55"
            }`}
          >
            {stop.barangay} • {stop.address}
          </div>
        </div>
      </div>


      {/* Details */}
      <div className="flex items-center gap-1.5 pl-[34px]">

        {/* Waste Type */}
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isHazardous
              ? "bg-red-100 text-red-700"
              : isNow
              ? "bg-white/10 text-white/80"
              : "bg-gray-100 text-slate-600"
          }`}
        >
          {stop.wasteType}
        </span>


        {/* Priority */}
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isCritical
              ? "bg-red-600 text-white"
              : stop.priority === "High"
              ? "bg-orange-100 text-orange-800"
              : isNow
              ? "bg-white/10 text-white/80"
              : "bg-gray-100 text-slate-600"
          }`}
        >
          {stop.priority}
        </span>


        {/* Volume */}
        <span
          className={`text-[10px] font-bold ml-auto ${
            isNow ? "text-white/60" : "opacity-45"
          }`}
        >
          {stop.volume}
        </span>

      </div>
    </div>
  );
}

export default MiniTaskCard;