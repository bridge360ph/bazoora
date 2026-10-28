import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { useHaulingRouteOptions } from "../hooks/useHaulingRouteOptions";
import { formatHaulingRouteOption } from "../haulingRouteApi";

interface HaulingRouteSelectProps {
  id: string;
  requestId: string;
  value: string | null;
  onChange: (routeId: string | null) => void;
  disabled?: boolean;
}

/**
 * Route picker for a hauling request. Only routes that can collect the
 * request's waste type are listed. "No route yet" is always available so a
 * request can be approved before a suitable route exists.
 */
export function HaulingRouteSelect({
  id,
  requestId,
  value,
  onChange,
  disabled = false,
}: HaulingRouteSelectProps): ReactNode {
  const { data: routes = [], isLoading, isError } =
    useHaulingRouteOptions(requestId);

  return (
    <div>
      <div className="relative mt-1.5">
        <select
          id={id}
          value={value ?? ""}
          disabled={disabled || isLoading}
          onChange={(event) => onChange(event.target.value || null)}
          className="h-9 w-full appearance-none rounded-md border border-surface-border bg-white px-3 pr-9 text-xs text-gray-800 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">No route yet</option>
          {routes.map((route) => (
            <option key={route.id} value={route.id}>
              {formatHaulingRouteOption(route)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      <p className="mt-1 text-[10px] text-gray-400">
        {isLoading
          ? "Loading routes..."
          : isError
            ? "Routes could not be loaded. You can still approve and assign a route later."
            : routes.length === 0
              ? "No routes collect this waste type yet. You can assign one later."
              : "Only routes that collect this waste type are listed."}
      </p>
    </div>
  );
}
