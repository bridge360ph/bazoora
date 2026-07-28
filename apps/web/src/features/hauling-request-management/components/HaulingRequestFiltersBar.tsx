import type {
  SenderTypeValue,
  WasteTypeValue,
} from "../haulingRequestManagement.types";

import {
  SENDER_FILTER_OPTIONS,
  WASTE_TYPE_FILTER_OPTIONS,
} from "../haulingRequestManagement.constants.ts";

import { MultiSelectFilterDropdown } from "./MultiSelectFilterDropdown";

interface HaulingRequestFiltersBarProps {
  selectedSenders: SenderTypeValue[];
  selectedWasteTypes: WasteTypeValue[];

  onToggleSender: (value: SenderTypeValue) => void;
  onClearSenders: () => void;

  onToggleWasteType: (value: WasteTypeValue) => void;
  onClearWasteTypes: () => void;

  onClearAll: () => void;
}

function findLabel<T extends string>(
  options: { label: string; value: T }[],
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * "Filter by Sender" and "Filter by Waste Type" are client-side, multi-select
 * filters. Selecting one or more values shows them as removable chips below
 * the dropdowns, plus a "Clear All Filters" action. The Eco-Aide search box
 * remains a disabled UI stub until assignment fields are available.
 */
export function HaulingRequestFiltersBar({
  selectedSenders,
  selectedWasteTypes,
  onToggleSender,
  onClearSenders,
  onToggleWasteType,
  onClearWasteTypes,
  onClearAll,
}: HaulingRequestFiltersBarProps) {
  const hasActiveFilters =
    selectedSenders.length > 0 || selectedWasteTypes.length > 0;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <MultiSelectFilterDropdown
          label="Filter by Sender"
          options={SENDER_FILTER_OPTIONS}
          allValue="ALL"
          selectedValues={selectedSenders}
          onToggleValue={onToggleSender}
          onClear={onClearSenders}
        />

        <MultiSelectFilterDropdown
          label="Filter by Waste Type"
          options={WASTE_TYPE_FILTER_OPTIONS}
          allValue="ALL"
          selectedValues={selectedWasteTypes}
          onToggleValue={onToggleWasteType}
          onClear={onClearWasteTypes}
        />

        {/* TODO: no Eco-Aide assignment field/endpoint yet; backend/Prisma pending */}
        <input
          type="text"
          disabled
          placeholder="Search Eco-Aide by name or ID..."
          title="Coming soon — Eco-Aide assignment is not yet tracked by the backend"
          className="flex-1 cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-400"
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {selectedSenders.length > 0 && (
            <>
              <span className="text-sm text-black">Sender:</span>
              {selectedSenders.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-secondary px-5 py-2 text-sm font-medium text-white"
                >
                  {findLabel(SENDER_FILTER_OPTIONS, value)}
                  <button
                    type="button"
                    onClick={() => onToggleSender(value)}
                    aria-label={`Remove ${value} filter`}
                    className="text-white/80 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </>
          )}

          {selectedWasteTypes.length > 0 && (
            <>
              <span className="ml-1 text-sm text-gray-900">Waste Type:</span>
              {selectedWasteTypes.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-secondary px-5 py-2 text-sm font-medium text-white"
                >
                  {findLabel(WASTE_TYPE_FILTER_OPTIONS, value)}
                  <button
                    type="button"
                    onClick={() => onToggleWasteType(value)}
                    aria-label={`Remove ${value} filter`}
                    className="text-white/80 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </>
          )}

          <button
            type="button"
            onClick={onClearAll}
            className="rounded-lg bg-brand-dark px-5 py-2 text-sm font-medium text-white"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
