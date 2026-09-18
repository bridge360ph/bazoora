import { useState, useRef, type ChangeEvent } from "react";
import { AlertTriangle, X, Camera, Loader2 } from "lucide-react";
import { Button } from "@bazoora/ui";
import { toast } from "sonner";
import { uploadIncidentPhoto, submitIncidentReport } from "../incident-api";

interface ReportIssueModalProps {
  isOpen: boolean;
  stopName: string;
  routeId?: string;
  onClose: () => void;
  onSubmit?: (issueData: { category: string; notes: string }) => void;
  onSuccess?: () => void;
}

export function ReportIssueModal({
  isOpen,
  stopName,
  routeId,
  onClose,
  onSubmit,
  onSuccess,
}: ReportIssueModalProps): React.ReactNode {
  const [category, setCategory] = useState<string>("Blocked Access");
  const [notes, setNotes] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // LIMIT ATTACHMENTS TO 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!notes.trim()) {
      toast.error("Please add issue details before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | undefined = undefined;

      // RESOLVE IMAGE URL VIA UNIFIED UPLOADER (BASE64 LOCALLY, S3 IN PRODUCTION)
      if (selectedFile) {
        imageUrl = await uploadIncidentPhoto(selectedFile);
      }

      // PERSIST INCIDENT RECORD IN DATABASE VIA BACKEND API
      await submitIncidentReport({
        category,
        description: notes.trim(),
        routeId,
        stopName,
        imageUrl,
      });

      // TRIGGER OPTIONAL PROP CALLBACKS
      onSubmit?.({ category, notes: notes.trim() });
      onSuccess?.();

      toast.success("Incident report submitted successfully.");
      setNotes("");
      handleClearFile();
      onClose();
    } catch (err) {
      console.error("Failed to submit incident report:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit incident report.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 font-black">
            <AlertTriangle className="h-5 w-5" />
            <span>Report Issue at Stop</span>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          Flagging obstacle or collection issue at{" "}
          <b className="text-gray-800">{stopName}</b>.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-60"
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
              disabled={isSubmitting}
              placeholder="Describe the issue at this stop..."
              className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
              Photo Evidence (Optional)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative mt-2 h-36 w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                <img
                  src={previewUrl}
                  alt="Issue preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleClearFile}
                  disabled={isSubmitting}
                  className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:bg-black disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-4 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-60"
              >
                <Camera className="h-4 w-4 text-gray-400" />
                <span>Take Photo or Upload Image</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-rose-600 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}