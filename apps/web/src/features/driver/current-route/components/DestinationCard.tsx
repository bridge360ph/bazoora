import { Icon } from "../../shared/icons";
import { icons } from "../../shared/iconData";


export function DestinationCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 min-w-0">

      {/* Header */}
      <div className="text-[11px] font-bold tracking-wide opacity-50 mb-2">
        DESTINATION POINT
      </div>


      {/* Destination Info */}
      <div className="flex items-center gap-3 mb-3.5">

        <div className="w-[38px] h-[38px] rounded-[10px] bg-green-100 text-green-800 flex items-center justify-center flex-shrink-0">
          <Icon
            icon={icons.bin}
            size={18}
          />
        </div>


        <div className="min-w-0">

          <div className="text-[15px] font-bold">
            Industrial Park Hub
          </div>


          <div className="text-xs opacity-55">
            Purok 12, Brgy. Manggahan, Cavite
          </div>

        </div>

      </div>


      {/* ETA */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">

        <span className="text-[11px] font-bold opacity-50 tracking-wide">
          GENERAL ETC
        </span>


        <span className="text-sm font-extrabold">
          01:05 PM
        </span>

      </div>


    </div>
  );
}


export default DestinationCard;