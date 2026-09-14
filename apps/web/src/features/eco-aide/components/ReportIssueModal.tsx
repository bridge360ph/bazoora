import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@bazoora/ui";
import { toast } from "sonner";

interface ReportIssueModalProps {
  isOpen: boolean;
  stopName: string;
  onClose: () => void;
  onSubmit: (issueData: { category: string; notes: string }) => void;
}

export function ReportIssueModal({
  isOpen,
  stopName,
  onClose,
  onSubmit,
}: ReportIssueModalProps): React.ReactNode {
  const [category, setCategory] = useState("Blocked Access");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSend = () => {
    if (!notes.trim()) {
      toast.error("Please add issue details before submitting.");
      return;
    }
    onSubmit({ category, notes });
    setNotes("");
    toast.success("Incident report drafted for this stop.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 font-black">
            <AlertTriangle className="h-5 w-5" />
            <span>Report Issue at Stop</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          Flagging obstacle or collection issue at <b className="text-gray-800">{stopName}</b>.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="Blocked Access">Blocked Access / Road Obstruction</option>
              <option value="Absent Bin">Absent Bin / No Waste Found</option>
              <option value="Hazardous Waste">Hazardous / Non-Compliant Waste</option>
              <option value="Collector Delay">Equipment Failure / Delay</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Notes / Description
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the issue at this stop..."
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 rounded-xl text-xs font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            className="flex-1 rounded-xl bg-rose-600 text-xs font-bold text-white shadow-md hover:bg-rose-700"
          >
            Submit Report
          </Button>
        </div>
      </div>
    </div>
  );
}
