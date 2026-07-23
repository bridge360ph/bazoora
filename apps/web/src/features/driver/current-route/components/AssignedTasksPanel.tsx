import { Icon } from "../../shared/icons";
import { icons } from "../../shared/iconData";

import { MiniTaskCard } from "./MiniTaskCard";
import { schedule } from "../data/schedule";


export function AssignedTasksPanel({
  onDashboard,
  onComplete,
  onReportIssue,
}: {
  onDashboard: () => void;
  onComplete?: () => void;
  onReportIssue?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden h-full">

      {/* Header */}
      <div className="px-[18px] pt-[18px] pb-3 border-b border-gray-100">

        <div className="text-[10px] font-bold tracking-wide text-green-700 uppercase mb-1">
          Assigned Tasks
        </div>


        <div
          className="text-lg font-extrabold mb-1 cursor-pointer"
          onClick={onDashboard}
          title="Back to Dashboard"
        >
          Daily Schedule
        </div>


        <div className="text-xs opacity-55">
          14 Collections • 3.2 tons est.
        </div>

      </div>


      {/* Task List */}
      <div className="px-3.5 py-2.5 flex flex-col gap-2.5 overflow-y-auto flex-1">

        {schedule.map((stop, index) => (
          <MiniTaskCard
            key={index}
            stop={stop}
          />
        ))}

      </div>


      {/* Actions */}
      <div className="mt-auto p-3.5 flex flex-col gap-2.5 border-t border-gray-100">


        {/* Complete Button */}
        <button
          type="button"
          onClick={onComplete}
          className="bg-green-400 border-none px-4 py-3.5 rounded-xl font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <Icon
            icon={icons.check}
          />

          Mark as Complete
        </button>



        {/* Report Button */}
        <button
          type="button"
          onClick={onReportIssue}
          className="bg-red-600 border-none px-4 py-3.5 rounded-xl text-white font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <Icon
            icon={icons.document}
          />

          Report Issue at this Stop
        </button>


      </div>

    </div>
  );
}


export default AssignedTasksPanel;