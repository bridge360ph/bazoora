import { useState } from "react";
import type { SenderFilterValue } from "../haulingRequestManagement.types.ts";
import { SENDER_FILTER_OPTIONS } from "../haulingRequestManagement.constants.ts";

interface HaulingRequestFiltersBarProps {
  senderFilter: SenderFilterValue;
  onSenderFilterChange: (value: SenderFilterValue) => void;
}

/**
 * Filter bar above the Hauling Request table.
 *
 * "Filter by Sender" is fully functional (filters client-side by
 * `senderType`). "Filter by Waste Type" and the Eco-Aide search box are
 * disabled UI stubs matching the Figma layout
 * 
 * TODO: wire these up once the backend exposes `wasteType` and Eco-Aide assignment fields (Prismaschema not finalized yet).
 */

export function HaulingRequestFiltersBar({
  senderFilter,
  onSenderFilterChange,
}: HaulingRequestFiltersBarProps) {
  const [isSenderOpen, setIsSenderOpen] = useState(false);
  const activeLabel =
    SENDER_FILTER_OPTIONS.find((o) => o.value === senderFilter)?.label ?? "All";

  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsSenderOpen((open) => !open)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium"
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

      {/* TODO: no `wasteType` field on HaulingRequest yet; backend/Prisma pending */}
      <button
        type="button"
        disabled
        title="Coming soon — waste type is not yet tracked by the backend"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
      >
        Filter by Waste Type
        <svg className="w-3 h-3" viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 0l5 6 5-6H0z" />
        </svg>
      </button>

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