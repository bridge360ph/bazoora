import type { HaulingRequest } from "@bazoora/shared";
import { useMemo, useState } from "react";
import {
  DataTable,
  Button,
  StatusBadge,
  type Column,
} from "@bazoora/ui";
import { useHaulingRequests } from "./hooks/useHaulingRequests";
import { useApproveHaulingRequest } from "./hooks/useApproveHaulingRequest";
import { useDenyHaulingRequest } from "./hooks/useDenyHaulingRequest";
import { HaulingRequestFiltersBar } from "./components/HaulingRequestFiltersBar";
import { HaulingRequestDetailModal } from "./components/HaulingRequestDetailModal";
import { ApproveHaulingRequestModal } from "./components/ApproveHaulingRequestModal";
import { DenyHaulingRequestModal } from "./components/DenyHaulingRequestModal";
import type {
  ModalMode,
  SenderTypeValue,
  WasteTypeValue,
} from "./haulingRequestManagement.types.ts";
import {
  HAULING_REQUESTS_PAGE_SIZE,
  STATUS_DISPLAY,
  SENDER_DISPLAY,
  WASTE_TYPE_DISPLAY,
} from "./haulingRequestManagement.constants.ts";

/**
 * Admin hauling request management screen.
 *
 * Rendered through the /admin/hauling route and displayed inside
 * the shared AdminLayout via React Router's Outlet.
 */

export function AdminHaulingRequestManagementPage() {
  const {
    data: requests,
    isLoading,
    isError,
    error,
    refetch,
  } = useHaulingRequests();
  const approveMutation = useApproveHaulingRequest();
  const denyMutation = useDenyHaulingRequest();

  // Multi-select filters: an empty array means "no filter applied" (show
  // everything). Selecting one or more values ORs them together within the
  // same filter, and ANDs across the two filters - see filteredRequests.
  const [selectedSenders, setSelectedSenders] = useState<SenderTypeValue[]>([]);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<
    WasteTypeValue[]
  >([]);
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRequest, setSelectedRequest] = useState<HaulingRequest | null>(
    null,
  );

  function toggleSender(value: SenderTypeValue) {
    setSelectedSenders((current) =>
      current.includes(value)
        ? current.filter((sender) => sender !== value)
        : [...current, value],
    );
    setPage(1);
  }

  function toggleWasteType(value: WasteTypeValue) {
    setSelectedWasteTypes((current) =>
      current.includes(value)
        ? current.filter((wasteType) => wasteType !== value)
        : [...current, value],
    );
    setPage(1);
  }

  function clearSenders() {
    setSelectedSenders([]);
    setPage(1);
  }

  function clearWasteTypes() {
    setSelectedWasteTypes([]);
    setPage(1);
  }

  function clearAllFilters() {
    setSelectedSenders([]);
    setSelectedWasteTypes([]);
    setPage(1);
  }

  const filteredRequests = useMemo(() => {
    if (!requests) return [];

    return requests.filter((request) => {
      const matchesSender =
        selectedSenders.length === 0 ||
        selectedSenders.includes(request.senderType);

      const matchesWasteType =
        selectedWasteTypes.length === 0 ||
        selectedWasteTypes.includes(request.wasteType);

      return matchesSender && matchesWasteType;
    });
  }, [requests, selectedSenders, selectedWasteTypes]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / HAULING_REQUESTS_PAGE_SIZE),
  );
  const paginatedRequests = filteredRequests.slice(
    (page - 1) * HAULING_REQUESTS_PAGE_SIZE,
    page * HAULING_REQUESTS_PAGE_SIZE,
  );

  function openDetail(request: HaulingRequest) {
    setSelectedRequest(request);
    setModalMode("detail");
  }

  function closeModal() {
    denyMutation.reset();
    setModalMode(null);
    setSelectedRequest(null);
  }

  function handleApprove(requestId: string) {
    approveMutation.mutate(requestId, { onSuccess: closeModal });
  }

  function handleDeny(
    requestId: string,
    denialReason: string,
  ) {
    denyMutation.mutate(
      {
        requestId,
        denialReason,
      },
      {
        onSuccess: closeModal,
      },
    );
  }

  const columns: Column<HaulingRequest>[] = [
    { key: "requestNumber", header: "Request ID" },
    { key: "requestAddress", header: "Location" },
    {
      key: "wasteType",
      header: "Waste Type",
      render: (row) => <span>{WASTE_TYPE_DISPLAY[row.wasteType]}</span>,
    },
    {
      key: "senderType",
      header: "Sent By",
      render: (row) => (
        <span>
          {SENDER_DISPLAY[row.senderType]}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={STATUS_DISPLAY[row.status]} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => openDetail(row)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <HaulingRequestFiltersBar
        selectedSenders={selectedSenders}
        selectedWasteTypes={selectedWasteTypes}
        onToggleSender={toggleSender}
        onClearSenders={clearSenders}
        onToggleWasteType={toggleWasteType}
        onClearWasteTypes={clearWasteTypes}
        onClearAll={clearAllFilters}
      />

      {isLoading && (
        <div className="py-16 text-center text-gray-400 text-sm">
          Loading hauling requests…
        </div>
      )}

      {isError && (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-red-600">
            Couldn&apos;t load hauling requests
            {error instanceof Error ? `: ${error.message}` : "."}
          </p>
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <DataTable<HaulingRequest>
            columns={columns}
            data={paginatedRequests}
            emptyMessage="No hauling requests to display."
          />

          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-gray-400 disabled:opacity-30"
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-brand text-white text-sm font-semibold">
              {page}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-gray-400 disabled:opacity-30"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </>
      )}

      {modalMode === "detail" && selectedRequest && (
        <HaulingRequestDetailModal
          request={selectedRequest}
          onClose={closeModal}
          onApproveClick={() => setModalMode("approve")}
          onDenyClick={() => setModalMode("deny")}
        />
      )}

      {modalMode === "approve" && selectedRequest && (
        <ApproveHaulingRequestModal
          request={selectedRequest}
          onClose={closeModal}
          onConfirm={handleApprove}
          isSubmitting={approveMutation.isPending}
        />
      )}

      {modalMode === "deny" && selectedRequest && (
        <DenyHaulingRequestModal
          request={selectedRequest}
          onClose={closeModal}
          onConfirm={handleDeny}
          isSubmitting={denyMutation.isPending}
          errorMessage={
            denyMutation.error instanceof Error
              ? denyMutation.error.message
              : undefined
          }
        />
      )}
    </div>
  );
}
