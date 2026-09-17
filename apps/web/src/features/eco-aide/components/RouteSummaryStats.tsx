import { MapPin, Navigation } from "lucide-react";

interface RouteSummaryStatsProps {
  routeName: string;
  barangay: string;
  completedStops: number;
  totalStops: number;
  isCollecting: boolean;
}

export function RouteSummaryStats({
  routeName,
  barangay,
  completedStops,
  totalStops,
  isCollecting,
}: RouteSummaryStatsProps): React.ReactNode {
  const progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-2.5 shadow-sm">
          <p className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Route</p>
          <div className="flex items-center gap-1.5 truncate text-xs font-bold text-gray-900">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">{barangay || routeName}</span>
          </div>
        </div>

        <div className="rounded-xl bg-white p-2.5 shadow-sm">
          <p className="text-[10px] font-black tracking-wider text-gray-400 uppercase">Tracking</p>
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
            <Navigation
              className={`h-3.5 w-3.5 shrink-0 ${isCollecting ? "text-emerald-600 animate-pulse" : "text-amber-500"}`}
            />
            <span className="truncate">{isCollecting ? "GPS Streaming" : "Standby"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-3 shadow-sm">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-bold text-gray-700">Route Progress</span>
          <span className="font-bold text-emerald-700">
            {completedStops}/{totalStops} Stops ({progress}%)
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
