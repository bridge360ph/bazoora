import { useEffect, useState, type ReactNode } from "react";
import type { HaulingRequest } from "@bazoora/shared";

import { listMyHaulingRequests } from "@/features/hauling-requests/api";

import NewRequestForm from "./hauling-requests/NewRequestForm";
import RequestDetailsModal from "./hauling-requests/RequestDetailsModal";
import RequestHistory from "./hauling-requests/RequestHistory";
import type { RequestTab } from "./hauling-requests/types";

export default function ResidentHaulingRequests(): ReactNode {
  const [activeTab, setActiveTab] = useState<RequestTab>("new");
  const [requests, setRequests] = useState<HaulingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<HaulingRequest | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    if (activeTab !== "history") return;

    async function loadRequestHistory() {
      try {
        setRequests(await listMyHaulingRequests());
      } catch (error) {
        console.error("Failed to load hauling requests:", error);
        setRequests([]);
      }
    }

    void loadRequestHistory();
  }, [activeTab, historyVersion]);

  function handleSubmitted() {
    setHistoryVersion((value) => value + 1);
    setActiveTab("history");
  }

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-surface p-5">
      <div className="mx-auto flex h-full w-full max-w-350 flex-col">
        <section className="w-full rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex justify-center gap-12 pt-6">
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

          <div key={activeTab} className="report-slide-in">
            {activeTab === "new" ? (
              <NewRequestForm onSubmitted={handleSubmitted} />
            ) : (
              <RequestHistory
                requests={requests}
                onSelectRequest={setSelectedRequest}
              />
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
