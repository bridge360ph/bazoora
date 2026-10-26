import { useState, type ChangeEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HaulingRequest } from "@bazoora/shared";

import {
  HISTORY_PAGE_SIZE,
  HISTORY_PAGE_SIZE_OPTIONS,
  WASTE_TYPE_LABELS,
} from "./constants";
import { formatDateTime } from "@/features/hauling-requests/haulingRequestFormat";
import { StatusBadge } from "./FormUi";

type SlideDirection = "left" | "right";

export default function RequestHistory({
  requests,
  onSelectRequest,
}: {
  requests: HaulingRequest[];
  onSelectRequest: (request: HaulingRequest) => void;
}): ReactNode {
  const [currentPage, setCurrentPage] = useState(1);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>("left");
  const [rowsPerPage, setRowsPerPage] = useState<number>(HISTORY_PAGE_SIZE);

  const totalRequests = requests.length;
  const totalPages = Math.max(1, Math.ceil(totalRequests / rowsPerPage));
  // Keeps the page valid if the list shrinks after a refresh.
  const page = Math.min(currentPage, totalPages);

  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalRequests);
  const pageRequests = requests.slice(startIndex, endIndex);
  const isLastPage = page === totalPages;

  function goToPage(nextPage: number, direction: SlideDirection) {
    setSlideDirection(direction);
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  function handleRowsPerPageChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const nextRowsPerPage = Number(event.target.value);

    // Stay on the page that contains the first request currently shown.
    setRowsPerPage(nextRowsPerPage);
    setCurrentPage(Math.floor(startIndex / nextRowsPerPage) + 1);
  }

  return (
    <div className="flex min-h-0 flex-auto flex-col px-6 pb-6 pt-5">
      <div
        key={page}
        className={`flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto pr-1 ${
          slideDirection === "left" ? "page-slide-left" : "page-slide-right"
        }`}
      >
        {pageRequests.map((request) => (
          <RequestCard
            key={request.requestId}
            request={request}
            onSelect={() => onSelectRequest(request)}
          />
        ))}

        {requests.length === 0 ? (
          <EmptySlot>No hauling requests yet.</EmptySlot>
        ) : (
          isLastPage && <EmptySlot>No more requests</EmptySlot>
        )}
      </div>

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

          <span className="flex h-7 w-7 items-center justify-center bg-blue-100 text-xs text-blue-700">
            {page}
          </span>

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
            {HISTORY_PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onSelect,
}: {
  request: HaulingRequest;
  onSelect: () => void;
}): ReactNode {
  return (
    <div className="flex min-h-20 shrink-0 items-center justify-between rounded-md border border-gray-200 bg-white px-5">
      <div className="min-w-0">
        <p className="text-[7px] text-gray-400">
          {formatDateTime(request.pickupDate)}
        </p>

        <p className="mt-0.5 text-sm font-bold text-gray-800">
          {WASTE_TYPE_LABELS[request.wasteType]}
        </p>

        <p className="text-[10px] text-gray-500">ID: {request.requestNumber}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={request.status} />

        <button
          type="button"
          onClick={onSelect}
          className="text-[8px] font-medium text-gray-700 hover:text-brand-secondary"
        >
          Details ›
        </button>
      </div>
    </div>
  );
}

/** Fills the leftover space in the list so the panel keeps the same height on every page. */
function EmptySlot({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex min-h-20 flex-auto items-center justify-center rounded-md border border-dashed border-gray-200 text-xs text-gray-400">
      {children}
    </div>
  );
}
