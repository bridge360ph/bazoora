import { useEffect, useState } from "react";
import { AlertCircle, FileText, Loader2, RefreshCw, X, ExternalLink } from "lucide-react";
import { Button, StatusBadge } from "@bazoora/ui";
import type { IncidentReport } from "@bazoora/shared";
import { getMyIncidentReports } from "../incident-api";

interface IncidentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IncidentHistoryModal({
  isOpen,
  onClose,
}: IncidentHistoryModalProps): React.ReactNode {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await getMyIncidentReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch incident history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchReports();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col rounded-3xl bg-white p-6 shadow-2xl">
        {/* MODAL HEADER */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-black text-gray-900">Incident Report History</h3>
              <p className="text-xs text-gray-400">Past issues and route flags submitted by your account</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void fetchReports()}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-700"
              title="Refresh Reports"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* REPORT LIST CONTAINER */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold text-gray-400">Loading your reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/50 p-6 text-center">
              <AlertCircle className="mb-2 h-8 w-8 text-gray-300" />
              <h4 className="text-sm font-bold text-gray-700">No Incidents Reported</h4>
              <p className="mt-1 text-xs text-gray-400">
                You have not filed any collection or stop issues yet.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 transition-all hover:border-gray-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-gray-900">
                        {report.reportNumber}
                      </span>
                      <span className="text-xs font-bold text-rose-600">
                        {report.category}
                      </span>
                    </div>
                    {report.stopName && (
                      <p className="mt-0.5 text-xs font-semibold text-gray-500">
                        Stop: <span className="text-gray-700">{report.stopName}</span>
                      </p>
                    )}
                  </div>
                  <StatusBadge status={report.status} />
                </div>

                <p className="mt-2 text-xs font-medium text-gray-600 leading-relaxed">
                  {report.description}
                </p>

                {/* PHOTO THUMBNAIL IF PRESENT */}
                {report.imageUrl && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedImage(report.imageUrl ?? null)}
                      className="group relative flex items-center gap-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 text-[11px] font-bold text-gray-600 hover:text-emerald-700"
                    >
                      <img
                        src={report.imageUrl}
                        alt="Report evidence"
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                      <span className="flex items-center gap-1 px-2">
                        View Attached Photo
                        <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                      </span>
                    </button>
                  </div>
                )}

                {/* ADMIN RESOLUTION NOTES */}
                {report.adminNotes && (
                  <div className="mt-3 rounded-xl bg-amber-50/70 p-2.5 text-[11px]">
                    <span className="font-bold text-amber-800">Admin Response: </span>
                    <span className="text-amber-900">{report.adminNotes}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] text-gray-400">
                  <span>
                    Filed on {new Date(report.createdAt).toLocaleDateString()} at{" "}
                    {new Date(report.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {report.resolvedAt && (
                    <span>
                      Resolved: {new Date(report.resolvedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* IMAGE PREVIEW LIGHTBOX */}
        {selectedImage && (
          <div
            className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-h-[85vh] max-w-xl">
              <img
                src={selectedImage}
                alt="Attachment enlarged"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-3 right-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs font-bold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}