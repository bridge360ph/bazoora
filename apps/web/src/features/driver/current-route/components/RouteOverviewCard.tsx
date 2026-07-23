import { Icon } from "../../shared/icons";
import { icons } from "../../shared/iconData";


export function RouteOverviewCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 min-w-0">

      {/* Header */}
      <div className="text-[11px] font-bold tracking-wide opacity-50 mb-2">
        ROUTE OVERVIEW
      </div>


      {/* Route Name */}
      <div className="text-[17px] font-extrabold mb-2.5">
        Route 1 - 12.4 km
      </div>


      {/* Current Location */}
      <div className="flex items-start gap-1.5 text-[13px] text-slate-700 mb-1.5">

        <Icon
          icon={icons.pin}
          size={15}
        />

        <span>
          Purok 7, Brgy. San Rafael, General Trias
        </span>

      </div>


      {/* Distance */}
      <div className="text-xs opacity-55">
        2.8 km from last collection point
      </div>


    </div>
  );
}


export default RouteOverviewCard;