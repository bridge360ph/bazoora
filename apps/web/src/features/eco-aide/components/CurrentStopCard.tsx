import { Check, AlertTriangle } from "lucide-react";
import { Button } from "@bazoora/ui";

interface CurrentStopCardProps {
  stopName: string;
  stopIndex: number;
  address: string;
  wasteType?: string;
  isCollecting: boolean;
  onComplete: () => void;
  onReportIssue: () => void;
}

export function CurrentStopCard({
  stopName,
  stopIndex,
  address,
  wasteType,
  isCollecting,
  onComplete,
  onReportIssue,
}: CurrentStopCardProps): React.ReactNode {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl bg-brand-dark px-[22px] py-[18px] text-white shadow-lg">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black tracking-widest text-emerald-300 uppercase">
            CURRENT STOP
          </span>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black tracking-wider text-orange-800 uppercase">
            {isCollecting ? "In Progress" : "Standby"}
          </span>
        </div>

        <div className="text-xl font-extrabold leading-tight">
          {stopName} — Stop {stopIndex + 1}
        </div>

        <div className="text-xs leading-relaxed text-emerald-100/80">
          {address} {wasteType ? `• ${wasteType}` : ""}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-1">
        <Button
          onClick={onComplete}
          disabled={!isCollecting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-bold text-[#003d1f] shadow hover:bg-emerald-300 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          Mark as Complete
        </Button>

        <Button
          onClick={onReportIssue}
          disabled={!isCollecting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-bold text-white shadow hover:bg-red-700 disabled:opacity-50"
        >
          <AlertTriangle className="h-4 w-4" />
          Report Issue at this Stop
        </Button>
      </div>
    </div>
  );
}
