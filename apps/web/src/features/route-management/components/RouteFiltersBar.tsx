import { FilterByDropdown } from "@bazoora/ui";
import type { RouteStatusFilter } from "../route.types";
import { ROUTE_STATUS_FILTERS } from "../routeFilters.constants";

interface RouteFiltersBarProps {
  statusFilter: RouteStatusFilter;
  onStatusFilterChange: (value: RouteStatusFilter) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function RouteFiltersBar({
  statusFilter,
  onStatusFilterChange,
  searchValue,
  onSearchChange,
}: RouteFiltersBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-stretch gap-3">
      <FilterByDropdown
        label="Filter by Status"
        value={statusFilter}
        options={ROUTE_STATUS_FILTERS}
        allValue="All"
        onChange={onStatusFilterChange}
      />

      <div className="relative min-w-[240px] flex-1">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="M17 17l-4-4" strokeLinecap="round" />
        </svg>

        <input
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search Eco-Aide by name or ID..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
