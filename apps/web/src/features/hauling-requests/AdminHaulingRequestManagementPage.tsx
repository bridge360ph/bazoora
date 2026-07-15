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
  SenderFilterValue,
  WasteTypeFilterValue,
} from "./haulingRequestManagement.types";
import {
  HAULING_REQUESTS_PAGE_SIZE,
  STATUS_DISPLAY,
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

  const [senderFilter, setSenderFilter] = useState<SenderFilterValue>("All");
  const [wasteTypeFilter, setWasteTypeFilter] = useState<WasteTypeFilterValue>("All");
  const [page, setPage] = useState(1);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRequest, setSelectedRequest] = useState<HaulingRequest | null>(
    null,
  );

  const filteredRequests = useMemo(() => {
    if (!requests) return [];

    return requests.filter((request) => {
      const matchesSender =
        senderFilter === "All" ||
        request.senderType === senderFilter;

      const matchesWasteType =
        wasteTypeFilter === "All" ||
        request.wasteType === wasteTypeFilter;

      return (
        matchesSender &&
        matchesWasteType
      );
    });
  }, [
    requests,
    senderFilter,
    wasteTypeFilter,
  ]);

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
    { key: "requestId", header: "Request ID" },
    { key: "requestAddress", header: "Location" },
    {
      key: "wasteType",
      header: "Waste Type",
      render: (row) => (
        <span>
          {row.wasteType.replace("_", " ")}
        </span>
      ),
    },
    { key: "senderType", header: "Sent By" },
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
        senderFilter={senderFilter}
        wasteTypeFilter={wasteTypeFilter}
        onSenderFilterChange={(value) => {
          setSenderFilter(value);
          setPage(1);
        }}
        onWasteTypeFilterChange={(value) => {
          setWasteTypeFilter(value);
          setPage(1);
        }}
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
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a3a2e] text-white text-sm font-semibold">
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
        />
      )}
    </div>
  );
}