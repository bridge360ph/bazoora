import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import type { HaulingRequest, HaulingRequestStatus } from "@bazoora/shared";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { useHaulingRequests } from "./hooks/useHaulingRequests";
import { useApproveHaulingRequest } from "./hooks/useApproveHaulingRequest";
import { useDenyHaulingRequest } from "./hooks/useDenyHaulingRequest";
import { useAssignHaulingRequestRoute } from "./hooks/useAssignHaulingRequestRoute";
import { HaulingRequestFiltersBar } from "./components/HaulingRequestFiltersBar";
import { HaulingRequestDetailModal } from "./components/HaulingRequestDetailModal";
import { ApproveHaulingRequestModal } from "./components/ApproveHaulingRequestModal";
import { DenyHaulingRequestModal } from "./components/DenyHaulingRequestModal";
import { AssignHaulingRouteModal } from "./components/AssignHaulingRouteModal";
import {
  HaulingStatusBadge,
  statusBorderClass,
} from "./components/HaulingStatusBadge";
import type {
  ModalMode,
  SenderTypeValue,
  WasteTypeValue,
} from "./haulingRequestManagement.types.ts";
import {
  HAULING_REQUESTS_PAGE_SIZE,
  HAULING_REQUESTS_PAGE_SIZE_OPTIONS,
  SENDER_DISPLAY,
  WASTE_TYPE_DISPLAY,
} from "./haulingRequestManagement.constants.ts";
import {
  formatDateTime,
  formatScheduledCollection,
  getPickupAddresses,
} from "./haulingRequestFormat";

type StatusTab = "ALL" | HaulingRequestStatus;
type SlideDirection = "left" | "right";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "PENDING", label: "PENDING" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "DENIED", label: "DENIED" },
  { value: "ALL", label: "ALL" },
];

// Pending requests need action, so they sort first; newest first within each group.
function compareRequests(a: HaulingRequest, b: HaulingRequest): number {
  const aPending = a.status === "PENDING" ? 0 : 1;
  const bPending = b.status === "PENDING" ? 0 : 1;
  if (aPending !== bPending) return aPending - bPending;
  return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
}

/**
 * Admin hauling request management screen.
 *
 * Rendered through the /admin/hauling route inside AdminLayout. Styled to
 * match the resident Hauling Requests screen: a white card panel with
 * centered tabs, request cards, and the same pagination footer.
 */
export function AdminHaulingRequestManagementPage(): ReactNode {
  const {
    data: requests,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
  } = useHaulingRequests();
  const approveMutation = useApproveHaulingRequest();
  const denyMutation = useDenyHaulingRequest();
  const assignRouteMutation = useAssignHaulingRequestRoute();

  const [statusTab, setStatusTab] = useState<StatusTab>("PENDING");

  // Multi-select filters: an empty array means "no filter applied" (show
  // everything). Selecting one or more values ORs them together within the
  // same filter, and ANDs across the two filters - see filteredRequests.
  const [selectedSenders, setSelectedSenders] = useState<SenderTypeValue[]>([]);
  const [selectedWasteTypes, setSelectedWasteTypes] = useState<
    WasteTypeValue[]
  >([]);
  const [searchValue, setSearchValue] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(
    HAULING_REQUESTS_PAGE_SIZE,
  );
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("left");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRequest, setSelectedRequest] = useState<HaulingRequest | null>(
    null,
  );

  // Sender and waste type filters apply before the status tabs so the tab
  // counts reflect what the admin would see on each tab.
  const filteredByAttributes = useMemo(() => {
    if (!requests) return [];

    const search = searchValue.trim().toLowerCase();

    return [...requests].sort(compareRequests).filter((request) => {
      const searchMatches =
        search === "" ||
        [
          request.route?.routeDisplayNumber,
          request.route?.name,
          request.route?.ecoAideName,
        ].some((value) => value?.toLowerCase().includes(search) ?? false);

      const senderMatches =
        selectedSenders.length === 0 ||
        selectedSenders.includes(request.senderType);

      const wasteTypeMatches =
        selectedWasteTypes.length === 0 ||
        selectedWasteTypes.includes(request.wasteType);

      return searchMatches && senderMatches && wasteTypeMatches;
    });
  }, [requests, searchValue, selectedSenders, selectedWasteTypes]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = {
      ALL: filteredByAttributes.length,
      PENDING: 0,
      APPROVED: 0,
      DENIED: 0,
    };
    for (const request of filteredByAttributes) counts[request.status] += 1;
    return counts;
  }, [filteredByAttributes]);

  const visibleRequests = useMemo(
    () =>
      statusTab === "ALL"
        ? filteredByAttributes
        : filteredByAttributes.filter((request) => request.status === statusTab),
    [filteredByAttributes, statusTab],
  );

  const totalRequests = visibleRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalRequests / rowsPerPage));
  // Keeps the page valid if the list shrinks after approving or denying.
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRequests);
  const pageRequests = visibleRequests.slice(startIndex, endIndex);

  function resetPage() {
    setSlideDirection("left");
    setCurrentPage(1);
  }

  function goToPage(nextPage: number, direction: SlideDirection) {
    setSlideDirection(direction);
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  function handleRowsPerPageChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextRowsPerPage = Number(event.target.value);
    setRowsPerPage(nextRowsPerPage);
    setCurrentPage(Math.floor(startIndex / nextRowsPerPage) + 1);
  }

  function toggleValue<T>(current: T[], value: T): T[] {
    return current.includes(value)
      ? current.filter((entry) => entry !== value)
      : [...current, value];
  }

  function toggleSender(value: SenderTypeValue) {
    resetPage();
    setSelectedSenders((current) => toggleValue(current, value));
  }

  function toggleWasteType(value: WasteTypeValue) {
    resetPage();
    setSelectedWasteTypes((current) => toggleValue(current, value));
  }

  function clearSenders() {
    resetPage();
    setSelectedSenders([]);
  }

  function clearWasteTypes() {
    resetPage();
    setSelectedWasteTypes([]);
  }

  function clearAllFilters() {
    resetPage();
    setSelectedSenders([]);
    setSelectedWasteTypes([]);
    setSearchValue("");
  }

  function changeSearch(value: string) {
    resetPage();
    setSearchValue(value);
  }

  function changeStatusTab(tab: StatusTab) {
    resetPage();
    setStatusTab(tab);
  }

  function openDetail(request: HaulingRequest) {
    setSelectedRequest(request);
    setModalMode("detail");
  }

  function closeModal() {
    setModalMode(null);
    setSelectedRequest(null);
    // Clear any previous error so it doesn't show on the next request opened.
    approveMutation.reset();
    denyMutation.reset();
    assignRouteMutation.reset();
  }

  function handleApprove(requestId: string, routeId: string | null) {
    approveMutation.mutate({ requestId, routeId }, { onSuccess: closeModal });
  }

  function handleAssignRoute(requestId: string, routeId: string | null) {
    assignRouteMutation.mutate({ requestId, routeId }, { onSuccess: closeModal });
  }

  function handleDeny(requestId: string, denialReason: string) {
    denyMutation.mutate({ requestId, denialReason }, { onSuccess: closeModal });
  }

  return (
    <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-surface p-5">
      <div className="mx-auto flex h-full w-full max-w-350 flex-col">
        <section className="flex h-full min-h-0 w-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Status tabs */}
          <div className="relative flex shrink-0 items-end border-b border-gray-100 pt-6">
            <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-3 sm:justify-center sm:gap-12 sm:px-14">
            {STATUS_TABS.map((tab) => (
              <TabButton
                key={tab.value}
                isActive={statusTab === tab.value}
                count={statusCounts[tab.value]}
                highlight={tab.value === "PENDING"}
                onClick={() => changeStatusTab(tab.value)}
              >
                {tab.label}
              </TabButton>
            ))}
            </div>

            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh requests"
              title="Refresh"
              className="mb-2 mr-3 shrink-0 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 sm:absolute sm:right-5 sm:top-5 sm:m-0"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Filters */}
          <div className="shrink-0 px-6 pt-5">
            <HaulingRequestFiltersBar
              selectedSenders={selectedSenders}
              selectedWasteTypes={selectedWasteTypes}
              onToggleSender={toggleSender}
              onClearSenders={clearSenders}
              onToggleWasteType={toggleWasteType}
              onClearWasteTypes={clearWasteTypes}
              onClearAll={clearAllFilters}
              searchValue={searchValue}
              onSearchChange={changeSearch}
            />
          </div>

          {/* List */}
          <div key={statusTab} className="report-slide-in flex min-h-0 flex-auto flex-col px-6 pb-6 pt-4">
            {isLoading && (
              <div className="flex flex-auto flex-col gap-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className="h-20 animate-pulse rounded-md border border-gray-100 bg-gray-50"
                  />
                ))}
              </div>
            )}

            {isError && (
              <EmptySlot>
                <div className="flex flex-col items-center gap-3">
                  <p className="text-red-600">
                    Couldn&apos;t load hauling requests
                    {error instanceof Error ? `: ${error.message}` : "."}
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="rounded-md border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Retry
                  </button>
                </div>
              </EmptySlot>
            )}

            {!isLoading && !isError && (
              <>
                <div
                  key={`${page}-${rowsPerPage}`}
                  className={`flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto pr-1 ${
                    slideDirection === "left" ? "page-slide-left" : "page-slide-right"
                  }`}
                >
                  {pageRequests.map((request) => (
                    <RequestCard
                      key={request.requestId}
                      request={request}
                      onSelect={() => openDetail(request)}
                    />
                  ))}

                  {totalRequests === 0 ? (
                    <EmptySlot>
                      {statusTab === "PENDING"
                        ? "No pending requests. You're all caught up."
                        : "No hauling requests to display."}
                    </EmptySlot>
                  ) : (
                    page === totalPages && <EmptySlot>No more requests</EmptySlot>
                  )}
                </div>

                {/* Pagination, same as the resident request history */}
                <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <p className="min-w-32 text-[10px] text-gray-500" aria-live="polite">
                    {totalRequests > 0 &&
                      `Showing ${startIndex + 1}–${endIndex} of ${totalRequests}`}
                  </p>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => goToPage(page - 1, "right")}
                      className="text-gray-500 hover:text-gray-800 disabled:opacity-30"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="flex h-7 min-w-7 items-center justify-center rounded-md bg-surface-border px-2 text-xs font-semibold text-brand-dark">
                      {page}
                    </span>
                    <span className="-ml-2 text-[10px] text-gray-400">of {totalPages}</span>

                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => goToPage(page + 1, "left")}
                      className="text-gray-500 hover:text-gray-800 disabled:opacity-30"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <label className="flex min-w-32 items-center justify-end gap-2 text-[10px] text-gray-500">
                    Rows per page
                    <select
                      value={rowsPerPage}
                      onChange={handleRowsPerPageChange}
                      className="h-7 rounded-md border border-gray-200 bg-white px-2 text-[10px] text-gray-700 outline-none"
                    >
                      {HAULING_REQUESTS_PAGE_SIZE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {modalMode === "detail" && selectedRequest && (
        <HaulingRequestDetailModal
          request={selectedRequest}
          onClose={closeModal}
          onApproveClick={() => setModalMode("approve")}
          onDenyClick={() => setModalMode("deny")}
          onAssignRouteClick={() => setModalMode("assignRoute")}
        />
      )}

      {modalMode === "assignRoute" && selectedRequest && (
        <AssignHaulingRouteModal
          request={selectedRequest}
          onClose={closeModal}
          onConfirm={handleAssignRoute}
          isSubmitting={assignRouteMutation.isPending}
          errorMessage={
            assignRouteMutation.error instanceof Error
              ? assignRouteMutation.error.message
              : undefined
          }
        />
      )}

      {modalMode === "approve" && selectedRequest && (
        <ApproveHaulingRequestModal
          request={selectedRequest}
          onClose={closeModal}
          onConfirm={handleApprove}
          isSubmitting={approveMutation.isPending}
          errorMessage={
            approveMutation.error instanceof Error
              ? approveMutation.error.message
              : undefined
          }
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

function TabButton({
  isActive,
  count,
  highlight,
  onClick,
  children,
}: {
  isActive: boolean;
  count: number;
  highlight: boolean;
  onClick: () => void;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 pb-3 text-xs font-bold sm:px-5 ${
        isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
      <span
        className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
          highlight && count > 0
            ? "bg-orange-100 text-orange-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {count}
      </span>

      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-px bg-brand-dark" />
      )}
    </button>
  );
}

function RequestCard({
  request,
  onSelect,
}: {
  request: HaulingRequest;
  onSelect: () => void;
}): ReactNode {
  const [firstPickup, ...otherPickups] = getPickupAddresses(request.requestAddress);
  const isPending = request.status === "PENDING";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex min-h-20 w-full shrink-0 items-center justify-between gap-4 rounded-md border border-l-2 border-gray-200 bg-white px-5 py-3 text-left transition hover:border-gray-300 hover:shadow-sm ${statusBorderClass(request.status)}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-sm font-bold text-gray-800">
            {WASTE_TYPE_DISPLAY[request.wasteType]}
          </p>
          <span className="rounded-full border border-surface-border px-2 py-px text-[10px] font-medium text-surface-muted">
            {SENDER_DISPLAY[request.senderType]}
          </span>
        </div>

        <p className="mt-0.5 text-[10px] text-gray-500">ID: {request.requestNumber}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-600">
          <span className="flex min-w-0 max-w-full items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
            <span
              className="truncate"
              title={[firstPickup, ...otherPickups].join("\n")}
            >
              {firstPickup}
            </span>
            {otherPickups.length > 0 && (
              <span className="shrink-0 text-gray-400">
                +{otherPickups.length} more
              </span>
            )}
          </span>

          <span className="flex shrink-0 items-center gap-1">
            <CalendarClock className="h-3 w-3 text-gray-400" />
            {request.route?.scheduledCollectionAt
              ? `Scheduled ${formatScheduledCollection(request.route.scheduledCollectionAt)}`
              : `Preferred ${formatDateTime(request.pickupDate)}`}
          </span>

          {request.status === "APPROVED" && (
            <span
              className={`shrink-0 ${request.route ? "text-gray-600" : "font-medium text-amber-700"}`}
            >
              {request.route
                ? `${request.route.routeDisplayNumber} · ${request.route.name}`
                : "No route yet"}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <HaulingStatusBadge status={request.status} />
        <span
          className={`flex items-center text-[11px] font-semibold ${
            isPending
              ? "text-brand-secondary group-hover:text-brand-dark"
              : "text-gray-500 group-hover:text-gray-800"
          }`}
        >
          {isPending ? "Review" : "Details"}
          <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

/** Fills the leftover space in the list so the panel keeps the same height on every page. */
function EmptySlot({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex min-h-20 flex-auto items-center justify-center rounded-md border border-dashed border-gray-200 px-4 text-center text-xs text-gray-400">
      {children}
    </div>
  );
}
