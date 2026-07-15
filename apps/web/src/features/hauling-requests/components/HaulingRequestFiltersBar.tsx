import { useState } from "react";
import type {
  SenderFilterValue,
  WasteTypeFilterValue,
} from "../haulingRequestManagement.types";
import {
  SENDER_FILTER_OPTIONS,
  WASTE_TYPE_FILTER_OPTIONS,
} from "../haulingRequestManagement.constants";

interface HaulingRequestFiltersBarProps {
  senderFilter: SenderFilterValue;
  wasteTypeFilter: WasteTypeFilterValue;

  onSenderFilterChange: (
    value: SenderFilterValue,
  ) => void;

  onWasteTypeFilterChange: (
    value: WasteTypeFilterValue,
  ) => void;
}

/**
 * "Filter by Sender" and "Filter by Waste Type" are client-side filters.
 * The Eco-Aide search box remains a disabled UI stub until assignment
 * fields are available.
 */

export function HaulingRequestFiltersBar({
  senderFilter,
  wasteTypeFilter,
  onSenderFilterChange,
  onWasteTypeFilterChange,
}: HaulingRequestFiltersBarProps) {
  const [isSenderOpen, setIsSenderOpen] = useState(false);
  const [isWasteTypeOpen, setIsWasteTypeOpen] = useState(false);

  const activeLabel =
    SENDER_FILTER_OPTIONS.find(
      (o) => o.value === senderFilter,
    )?.label ?? "All";

  const activeWasteTypeLabel =
    WASTE_TYPE_FILTER_OPTIONS.find(
      (o) => o.value === wasteTypeFilter,
    )?.label ?? "All";

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsSenderOpen((open) => !open)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a3a2e] text-white text-sm font-medium"
        >
          Filter by Sender: {activeLabel}
          <svg className="w-3 h-3" viewBox="0 0 10 6" fill="currentColor">
            <path d="M0 0l5 6 5-6H0z" />
          </svg>
        </button>
        {isSenderOpen && (
          <div className="absolute z-10 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {SENDER_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSenderFilterChange(option.value);
                  setIsSenderOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TODO: add waste type filtering in a separate feature */}
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setIsWasteTypeOpen((open) => !open)
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a3a2e] text-white text-sm font-medium"
        >
          Filter by Waste Type: {activeWasteTypeLabel}

          <svg
            className="w-3 h-3"
            viewBox="0 0 10 6"
            fill="currentColor"
          >
            <path d="M0 0l5 6 5-6H0z" />
          </svg>
        </button>

        {isWasteTypeOpen && (
          <div className="absolute z-10 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {WASTE_TYPE_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onWasteTypeFilterChange(option.value);
                  setIsWasteTypeOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TODO: no Eco-Aide assignment field/endpoint yet; backend/Prisma pending */}
      <input
        type="text"
        disabled
        placeholder="Search Eco-Aide by name or ID..."
        title="Coming soon — Eco-Aide assignment is not yet tracked by the backend"
        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
      />
    </div>
  );
}