import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HaulingRequest } from "@bazoora/shared";

import { HISTORY_PAGE_SIZE, WASTE_TYPE_LABELS } from "./constants";
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

  const totalPages = Math.max(1, Math.ceil(requests.length / HISTORY_PAGE_SIZE));
  // Keeps the page valid if the list shrinks after a refresh.
  const page = Math.min(currentPage, totalPages);

  const startIndex = (page - 1) * HISTORY_PAGE_SIZE;
  const pageRequests = requests.slice(startIndex, startIndex + HISTORY_PAGE_SIZE);

  function goToPage(nextPage: number, direction: SlideDirection) {
    setSlideDirection(direction);
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  return (
    <div className="px-6 pb-6 pt-5">
      <div
        key={page}
        className={`space-y-3 ${
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

        {requests.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-400">
            No hauling requests yet.
          </p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-center gap-4">
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
    <div className="flex min-h-20 items-center justify-between rounded-md border border-gray-200 bg-white px-5">
      <div className="min-w-0">
        <p className="text-[7px] text-gray-400">
          {new Date(request.pickupDate).toLocaleDateString()}
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
