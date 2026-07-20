import type {
  SenderFilterValue,
  WasteTypeFilterValue,
} from "../haulingRequestManagement.types";

import {
  SENDER_FILTER_OPTIONS,
  WASTE_TYPE_FILTER_OPTIONS,
} from "../haulingRequestManagement.constants.ts";

import { FilterByDropdown } from "@bazoora/ui";

interface HaulingRequestFiltersBarProps {
  senderFilter: SenderFilterValue;
  wasteTypeFilter: WasteTypeFilterValue;

  onSenderFilterChange: (value: SenderFilterValue) => void;

  onWasteTypeFilterChange: (value: WasteTypeFilterValue) => void;
}

const SENDER_OPTIONS: SenderFilterValue[] = SENDER_FILTER_OPTIONS.map(
  (option) => option.value,
);

const WASTE_TYPE_OPTIONS: WasteTypeFilterValue[] = WASTE_TYPE_FILTER_OPTIONS.map(
  (option) => option.value,
);

/**
 * "Filter by Sender" and "Filter by Waste Type" are client-side filters.
 * The Eco-Aide search box remains a disabled UI stub until assignment
 * fields are available.
 *
 */

export function HaulingRequestFiltersBar({
  senderFilter,
  wasteTypeFilter,
  onSenderFilterChange,
  onWasteTypeFilterChange,
}: HaulingRequestFiltersBarProps) {
  return (
    <div className="text-gray-800 mb-4 flex items-center gap-3">
      <FilterByDropdown
        label="Filter by Sender"
        value={senderFilter}
        options={SENDER_OPTIONS}
        allValue="ALL"
        onChange={onSenderFilterChange}
      />

      <FilterByDropdown
        label="Filter by Waste Type"
        value={wasteTypeFilter}
        options={WASTE_TYPE_OPTIONS}
        allValue="ALL"
        onChange={onWasteTypeFilterChange}
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
  );
}
