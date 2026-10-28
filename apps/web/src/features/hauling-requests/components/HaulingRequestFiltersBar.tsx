import type {
  SenderTypeValue,
  WasteTypeValue,
} from "../haulingRequestManagement.types.ts";

import {
  SENDER_FILTER_OPTIONS,
  WASTE_TYPE_FILTER_OPTIONS,
} from "../haulingRequestManagement.constants.ts";

import { Search, X } from "lucide-react";

import { MultiSelectFilterDropdown } from "./MultiSelectFilterDropdown";

interface HaulingRequestFiltersBarProps {
  selectedSenders: SenderTypeValue[];
  selectedWasteTypes: WasteTypeValue[];

  onToggleSender: (value: SenderTypeValue) => void;
  onClearSenders: () => void;

  onToggleWasteType: (value: WasteTypeValue) => void;
  onClearWasteTypes: () => void;

  onClearAll: () => void;

  searchValue: string;
  onSearchChange: (value: string) => void;
}

function findLabel<T extends string>(
  options: { label: string; value: T }[],
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * Sender and waste type are client-side multi-select filters. The search box
 * matches the assigned route number, route name or eco-aide name.
 */
export function HaulingRequestFiltersBar({
  selectedSenders,
  selectedWasteTypes,

  onToggleSender,
  onClearSenders,
  onToggleWasteType,
  onClearWasteTypes,
  onClearAll,
  searchValue,
  onSearchChange,
}: HaulingRequestFiltersBarProps) {
  const hasActiveFilters =
    selectedSenders.length > 0 || selectedWasteTypes.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
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

        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search route or eco-aide (e.g. RT-001)"
            className="h-9 w-full rounded-md border border-surface-border bg-white pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {selectedSenders.length > 0 && (
            <>
              <span className="text-[10px] font-semibold tracking-wider text-gray-400">SENDER</span>
              {selectedSenders.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-[#f8fbf9] py-1 pl-3 pr-1.5 text-[11px] font-medium text-brand-secondary"
                >
                  {findLabel(SENDER_FILTER_OPTIONS, value)}
                  <button
                    type="button"
                    onClick={() => onToggleSender(value)}
                    aria-label={`Remove ${value} filter`}
                    className="rounded-full p-0.5 text-surface-muted hover:bg-surface-border hover:text-brand-dark"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </>
          )}

          {selectedWasteTypes.length > 0 && (
            <>
              <span className="ml-1 text-[10px] font-semibold tracking-wider text-gray-400">WASTE TYPE</span>
              {selectedWasteTypes.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-[#f8fbf9] py-1 pl-3 pr-1.5 text-[11px] font-medium text-brand-secondary"
                >
                  {findLabel(WASTE_TYPE_FILTER_OPTIONS, value)}
                  <button
                    type="button"
                    onClick={() => onToggleWasteType(value)}
                    aria-label={`Remove ${value} filter`}
                    className="rounded-full p-0.5 text-surface-muted hover:bg-surface-border hover:text-brand-dark"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </>
          )}

          <button
            type="button"
            onClick={onClearAll}
            className="ml-1 text-[11px] font-semibold text-gray-500 underline-offset-2 hover:text-brand-dark hover:underline"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
