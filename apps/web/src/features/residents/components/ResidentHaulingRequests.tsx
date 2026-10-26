import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import type { HaulingRequest } from "@bazoora/shared";

import { listMyHaulingRequests } from "@/features/hauling-requests/api";

import NewRequestForm, {
  type SubmitResult,
} from "./hauling-requests/NewRequestForm";
import RequestDetailsModal from "./hauling-requests/RequestDetailsModal";
import RequestHistory from "./hauling-requests/RequestHistory";
import type { RequestTab } from "./hauling-requests/types";

export default function ResidentHaulingRequests(): ReactNode {
  // ?tab=history lets other screens (dashboard, schedule) link straight to the history list.
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<RequestTab>(
    searchParams.get("tab") === "history" ? "history" : "new",
  );
  const [requests, setRequests] = useState<HaulingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<HaulingRequest | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [loadState, setLoadState] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab !== "history") return;

    let cancelled = false;

    async function loadRequestHistory() {
      setLoadState("loading");

      try {
        const data = await listMyHaulingRequests();
        if (cancelled) return;
        setRequests(data);
        setLoadState("ready");
      } catch (error) {
        console.error("Failed to load hauling requests:", error);
        // Show an error rather than an empty list, which would read as
        // "you have no requests".
        if (!cancelled) setLoadState("error");
      }
    }

    void loadRequestHistory();

    return () => {
      cancelled = true;
    };
  }, [activeTab, historyVersion]);

  function handleSubmitted({ photoAttached }: SubmitResult) {
    setNotice(
      photoAttached
        ? null
        : "Your request was submitted, but the photo could not be attached.",
    );
    setHistoryVersion((value) => value + 1);
    setActiveTab("history");
  }

  return (
    <main className="h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-surface p-5">
      <div className="mx-auto flex h-full w-full max-w-350 flex-col">
        <section className="flex h-full min-h-0 w-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex shrink-0 justify-center gap-12 pt-6">
            <TabButton
              isActive={activeTab === "new"}
              onClick={() => setActiveTab("new")}
            >
              NEW REQUEST
            </TabButton>

            <TabButton
              isActive={activeTab === "history"}
              onClick={() => setActiveTab("history")}
            >
              REQUEST HISTORY
            </TabButton>
          </div>

          <div
            key={activeTab}
            className="report-slide-in flex min-h-0 flex-auto flex-col overflow-x-hidden overflow-y-auto"
          >
            {activeTab === "new" ? (
              <NewRequestForm onSubmitted={handleSubmitted} />
            ) : loadState === "error" ? (
              <div className="flex flex-auto flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                <p className="text-xs text-red-600">
                  We couldn&apos;t load your hauling requests.
                </p>
                <button
                  type="button"
                  onClick={() => setHistoryVersion((value) => value + 1)}
                  className="rounded-md border border-gray-200 px-4 py-1.5 text-[10px] font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Try again
                </button>
              </div>
            ) : loadState === "loading" && requests.length === 0 ? (
              <p className="px-6 py-10 text-center text-xs text-gray-400">
                Loading your requests...
              </p>
            ) : (
              <>
                {notice && (
                  <div
                    role="status"
                    className="mx-6 mt-5 rounded-md bg-amber-50 px-3 py-2 text-[10px] text-amber-800"
                  >
                    {notice}
                  </div>
                )}
                <RequestHistory
                  requests={requests}
                  onSelectRequest={setSelectedRequest}
                />
              </>
            )}
          </div>

          {selectedRequest && (
            <RequestDetailsModal
              request={selectedRequest}
              onClose={() => setSelectedRequest(null)}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-5 pb-3 text-xs font-bold ${
        isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}

      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-px bg-brand-dark" />
      )}
    </button>
  );
}
