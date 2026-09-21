"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { listMyHaulingRequests } from "@/features/hauling-requests/api";

type RequestTab = "new" | "history";

export default function ResidentHaulingRequests(): React.ReactNode {
  const [activeTab, setActiveTab] =
    useState<RequestTab>("new");

  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab !== "history") return;

    listMyHaulingRequests()
      .then(setRequests)
      .catch((error) => {
        console.error(
          "Failed to load hauling requests:",
          error,
        );
      });
  }, [activeTab]);

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-surface p-5">
      <div className="mx-auto flex h-full w-full max-w-350 flex-col">
        <section
          className={`rounded-xl border border-gray-200 bg-white shadow-sm ${
            activeTab === "history" ? "w-full" : "w-90 self-center"
          }`}
        >
          {/* Tabs */}
          <div className="flex justify-center gap-12 pt-6">
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`relative px-5 pb-3 text-xs font-bold ${
                activeTab === "new"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              NEW REQUEST

              {activeTab === "new" && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-brand-dark" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`relative px-5 pb-3 text-xs font-bold ${
                activeTab === "history"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              REQUEST HISTORY

              {activeTab === "history" && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-brand-dark" />
              )}
            </button>
          </div>

          {/* Sliding tab content */}
          <div key={activeTab} className="report-slide-in">
            {activeTab === "new" ? (
              <NewRequest />
            ) : (
              <RequestHistory requests={requests} />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function NewRequest(): React.ReactNode {
  return (
    <div className="w-full px-6 pb-6 pt-5">
      {/* Request ID */}
      <div>
        <label className="text-[10px] font-medium text-gray-700">
          Request ID
        </label>

        <div className="mt-1.5 flex h-9 items-center rounded-md border border-surface-border bg-[#f8fbf9] px-3 text-xs text-surface-muted">
          Generated automatically
        </div>
      </div>

      {/* Photo Attachment */}
      <div className="mt-4">
        <label className="text-[10px] font-medium text-gray-700">
          Photo Attachment (optional)
        </label>

        <button
          type="button"
          className="mt-1.5 flex h-24 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white transition hover:bg-gray-50"
        >
          <Camera className="h-6 w-6 text-surface-muted" />

          <span className="mt-2 text-[10px] font-medium text-surface-muted">
            Tap to upload/capture issue photo
          </span>

          <span className="mt-1 text-[8px] tracking-wider text-gray-400">
            JPG, PNG UP TO 10MB
          </span>
        </button>
      </div>

      {/* Waste Type */}
      <div className="mt-4">
        <label className="text-[10px] font-medium text-gray-700">
          Waste Type
        </label>

        <div className="mt-1.5 flex h-9 items-center justify-between rounded-md border border-surface-border bg-white px-3 text-xs text-surface-muted">
          <span>Select type...</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>

      {/* Request Details */}
      <div className="mt-4">
        <label className="text-[10px] font-medium text-gray-700">
          Request Details
        </label>

        <textarea
          placeholder="Describe your request..."
          className="mt-1.5 h-25 w-full resize-none rounded-md border border-surface-border bg-white px-3 py-2 text-xs text-gray-700 outline-none placeholder:text-[#6d8b7b] focus:border-brand-secondary"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#222] text-[10px] font-semibold text-white transition hover:bg-black"
      >
        SUBMIT REQUEST
        <span>→</span>
      </button>
    </div>
  );
}

function RequestHistory({
  requests,
}: {
  requests: any[];
}): React.ReactNode {
  return (
    <div className="px-6 pb-6 pt-5">
      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.requestId}
            className="flex min-h-20 items-center justify-between rounded-md border border-gray-200 bg-white px-5"
          >
            <div className="min-w-0">
              <p className="text-[7px] text-gray-400">
                {new Date(request.pickupDate).toLocaleDateString()}
              </p>

              <p className="mt-0.5 text-sm font-bold text-gray-800">
                {request.wasteType}
              </p>

              <p className="text-[10px] text-gray-500">
                ID: {request.requestNumber}
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[7px] font-bold text-orange-700">
                {request.status}
              </span>

              <button
                type="button"
                className="text-[8px] font-medium text-gray-700 hover:text-brand-secondary"
              >
                Details ›
              </button>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-400">
            No hauling requests yet.
          </p>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-center gap-4">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-800"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="flex h-7 w-7 items-center justify-center bg-blue-100 text-xs text-blue-700">
          1
        </span>

        <button
          type="button"
          className="text-gray-500 hover:text-gray-800"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}