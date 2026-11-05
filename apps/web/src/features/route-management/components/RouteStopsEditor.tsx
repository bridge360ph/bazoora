import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, MapPin, Search, Sparkles, X } from "lucide-react";

import SmartMap from "@/components/map/smart-map";
import type { MapMarker, MapRoute } from "@/components/map/smart-map";
import { geocode, reverseGeocode, type GeocodeResult } from "@/lib/geocoding";
import { BRANCHES, nearestBranches, type Branch } from "@/lib/branches";
import { planRoute } from "@/lib/routeOptimizer";
import { planStreetCoverage, type CoveragePlan } from "@/lib/streetCoverage";
import { isInsideArea, type AreaBoundary } from "@/lib/area";
import {
  isLocatedStop,
  type EditableRouteStop,
} from "../route.types";

interface RouteStopsEditorProps {
  stops: EditableRouteStop[];
  onChange: (stops: EditableRouteStop[]) => void;
  /** Added to lookups of stops that have no position yet, to narrow them down. */
  barangay: string;
  /**
   * Set when the stops must stay in their order (the resident asked for it).
   * Optimize Checkpoints then only picks the best starting branch, and this
   * text is shown.
   */
  optimizeLockedReason?: string;
  /**
   * The barangay a weekly route covers. Address search is limited to it,
   * its outline is drawn on the map, and stops outside it are flagged.
   */
  area?: AreaBoundary | null;
  areaName?: string;
}

// Wait for a pause in typing before searching, and respect Nominatim's limit
// of about one request per second.
const SEARCH_DELAY_MS = 500;
const MIN_QUERY_LENGTH = 3;
// Imus, Cavite: used until the route has a located stop.
const DEFAULT_CENTER: [number, number] = [14.4297, 120.9367];

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function newStopId(): string {
  return `stop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** "Imus City Hall, Nueno Avenue, Imus, Cavite, …" becomes "Imus City Hall". */
function shortName(displayName: string): string {
  return displayName.split(",")[0]?.trim() || displayName;
}

/**
 * Edits a route's stops. Each stop is chosen from address suggestions or by
 * clicking the map, so it is saved with its exact position instead of being
 * guessed from its name later.
 */
export function RouteStopsEditor({
  stops,
  onChange,
  barangay,
  optimizeLockedReason,
  area = null,
  areaName = "the barangay",
}: RouteStopsEditorProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const [locatingId, setLocatingId] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeMessage, setOptimizeMessage] = useState<string | null>(null);
  // The branch Optimize Checkpoints chose. Cleared when the stops change.
  const [plannedBranch, setPlannedBranch] = useState<Branch | null>(null);
  // The path through every street of the barangay, kept for the area it was made for.
  const [coverage, setCoverage] = useState<{ areaKey: string; plan: CoveragePlan } | null>(null);
  const areaKey = area ? area.center.join(",") : "";
  const currentCoverage = coverage && coverage.areaKey === areaKey ? coverage.plan : null;
  const searchRequestRef = useRef(0);
  // The latest stops, for changes that finish after an address lookup. Two
  // quick map clicks, or a rename during a lookup, must not undo each other.
  const latestStopsRef = useRef(stops);

  useEffect(() => {
    latestStopsRef.current = stops;
  }, [stops]);

  function commitStops(next: EditableRouteStop[]) {
    latestStopsRef.current = next;
    onChange(next);
  }

  useEffect(() => {
    const trimmed = query.trim();

    // Short queries are cleared in handleQueryChange, not here.
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return;
    }

    const requestId = ++searchRequestRef.current;
    const timeout = setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);

      geocode(trimmed, {
        limit: 5,
        countryCodes: "ph",
        ...(area && { viewbox: area.viewbox, bounded: true }),
      })
        .then((results) => {
          if (requestId === searchRequestRef.current) {
            setSuggestions(results);
          }
        })
        .catch(() => {
          if (requestId === searchRequestRef.current) {
            setSuggestions([]);
            setSearchError("Address search is unavailable. Click the map to place the stop.");
          }
        })
        .finally(() => {
          if (requestId === searchRequestRef.current) {
            setIsSearching(false);
          }
        });
    }, SEARCH_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [query, area]);

  // Any manual edit makes an earlier optimize summary out of date.
  function updateStops(next: EditableRouteStop[]) {
    setOptimizeMessage(null);
    setPlannedBranch(null);
    commitStops(next);
  }

  function handleQueryChange(value: string) {
    setQuery(value);

    if (value.trim().length < MIN_QUERY_LENGTH) {
      searchRequestRef.current += 1;
      setSuggestions([]);
      setSearchError(null);
      setIsSearching(false);
    }
  }

  function addStop(stop: Omit<EditableRouteStop, "id">) {
    updateStops([...latestStopsRef.current, { ...stop, id: newStopId() }]);
  }

  function pickSuggestion(result: GeocodeResult) {
    addStop({
      name: shortName(result.display_name),
      address: result.display_name,
      lat: result.lat,
      lng: result.lon,
    });
    handleQueryChange("");
  }

  async function handleMapClick([lat, lng]: [number, number]) {
    setIsPinning(true);

    try {
      const result = await reverseGeocode(lat, lng);
      const address = result.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      addStop({ name: shortName(address), address, lat, lng });
    } catch {
      const address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      addStop({ name: "Pinned location", address, lat, lng });
    } finally {
      setIsPinning(false);
    }
  }

  async function locateStop(stop: EditableRouteStop) {
    setLocatingId(stop.id);

    try {
      const query = barangay.trim() ? `${stop.name}, ${barangay}` : stop.name;
      const [match] = await geocode(query, { limit: 1, countryCodes: "ph" });

      if (match) {
        updateStops(
          latestStopsRef.current.map((current) =>
            current.id === stop.id
              ? { ...current, address: match.display_name, lat: match.lat, lng: match.lon }
              : current,
          ),
        );
      } else {
        setSearchError(`"${stop.name}" was not found. Search for it above or click the map.`);
      }
    } catch {
      setSearchError("Address search is unavailable. Click the map to place the stop.");
    } finally {
      setLocatingId(null);
    }
  }

  async function optimizeStops() {
    const locatedStops = stops.filter(isLocatedStop);
    if (locatedStops.length !== stops.length || stops.length === 0) return;

    setIsOptimizing(true);
    setOptimizeMessage(null);

    // A weekly route covers its whole barangay: plan a path through every
    // street, then order the collection points along it.
    if (area && optimizeLockedReason === undefined) {
      try {
        const plan = await planStreetCoverage(area);

        if (plan && plan.path.length > 1) {
          const pathIndexOf = (stop: { lat: number; lng: number }) => {
            let best = 0;
            let bestDistance = Infinity;
            plan.path.forEach(([lat, lng], index) => {
              const distance = (lat - stop.lat) ** 2 + (lng - stop.lng) ** 2;
              if (distance < bestDistance) {
                bestDistance = distance;
                best = index;
              }
            });
            return best;
          };

          const reordered = [...stops].sort(
            (a, b) =>
              pathIndexOf({ lat: a.lat ?? 0, lng: a.lng ?? 0 }) -
              pathIndexOf({ lat: b.lat ?? 0, lng: b.lng ?? 0 }),
          );

          if (reordered.some((stop, index) => stop.id !== stops[index]?.id)) {
            commitStops(reordered);
          }

          setCoverage({ areaKey, plan });
          setPlannedBranch(plan.branch);
          setOptimizeMessage(
            `The path covers ${plan.points.length} points on ${
              plan.streetCount > 0 ? `${plan.streetCount} streets` : "the streets"
            } of ${areaName}, starting from ${plan.branch.name}: about ${formatDistance(plan.meters)} and ${formatDuration(plan.seconds)} of driving.${
              plan.estimated
                ? " Part of the path is a straight line because the routing service did not answer."
                : ""
            }${
              plan.skipped > 0
                ? ` ${plan.skipped} spots could not be checked, so some streets may be missing.`
                : ""
            }`,
          );
          setIsOptimizing(false);
          return;
        }
      } catch {
        // Falls back to ordering the collection points only.
      }
    }

    try {
      const keepOrder = optimizeLockedReason !== undefined;
      const result = await planRoute(
        locatedStops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
        { keepOrder },
      );

      if (!result) return;

      const reordered: EditableRouteStop[] = result.order.flatMap((index) => {
        const stop = stops[index];
        return stop ? [stop] : [];
      });

      const unchanged = reordered.every((stop, index) => stop.id === stops[index]?.id);

      if (!unchanged) {
        commitStops(reordered);
      }

      setPlannedBranch(result.branch);

      const from = `${result.branch.name} (nearest of ${result.branchesCompared} branches by driving time)`;
      const summary = keepOrder
        ? `Starts from ${from}, keeping the resident's order: about ${formatDuration(result.after.seconds)} (${formatDistance(result.after.meters)}).`
        : unchanged
          ? `Starts from ${from}. Already the best order: about ${formatDuration(result.after.seconds)} (${formatDistance(result.after.meters)}).`
          : `Starts from ${from}. Optimized: about ${formatDuration(result.before.seconds)} → ${formatDuration(result.after.seconds)} (${formatDistance(result.before.meters)} → ${formatDistance(result.after.meters)}).`;

      setOptimizeMessage(
        result.estimated
          ? `${summary} Driving times were estimated because the routing service was unavailable.`
          : summary,
      );
    } catch {
      setOptimizeMessage("Could not optimize the stops right now. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  }

  function renameStop(id: string, name: string) {
    updateStops(latestStopsRef.current.map((stop) => (stop.id === id ? { ...stop, name } : stop)));
  }

  function moveStop(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= stops.length) return;

    const next = [...latestStopsRef.current];
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    updateStops(next);
  }

  function removeStop(id: string) {
    updateStops(latestStopsRef.current.filter((stop) => stop.id !== id));
  }

  const located = stops.filter(isLocatedStop);
  const lastLocated = located[located.length - 1];
  const mapCenter: [number, number] = lastLocated
    ? [lastLocated.lat, lastLocated.lng]
    : (area?.center ?? DEFAULT_CENTER);
  // Until Optimize Checkpoints runs, the closest branch in a straight line.
  const startBranch: Branch =
    plannedBranch ??
    nearestBranches(
      located.length > 0
        ? located.map((stop) => ({ lat: stop.lat, lng: stop.lng }))
        : area
          ? [{ lat: area.center[0], lng: area.center[1] }]
          : [],
      1,
    )[0] ??
    BRANCHES[0] ?? { id: "hq", name: "Head office", city: "", lat: 0, lng: 0 };
  const isOutside = (stop: EditableRouteStop) =>
    area !== null && isLocatedStop(stop) && !isInsideArea(area, [stop.lat, stop.lng]);

  const markers: MapMarker[] = [
    {
      id: "depot",
      position: [startBranch.lat, startBranch.lng] as [number, number],
      label: startBranch.name,
      icon: "home" as const,
    },
    ...stops.flatMap((stop, index) =>
    isLocatedStop(stop)
      ? [
          {
            id: stop.id,
            position: [stop.lat, stop.lng] as [number, number],
            label: stop.name,
            icon: "stop" as const,
            stopNumber: index + 1,
          },
        ]
      : [],
    ),
  ];

  const areaOutlines: MapRoute[] = (area?.rings ?? []).map((ring) => ({
    path: ring,
    color: "gray",
    label: areaName,
  }));

  const mapRoutes: MapRoute[] = [
    ...areaOutlines,
    ...(currentCoverage
      ? [{ path: currentCoverage.path, color: "green" as const, label: "Street coverage" }]
      : located.length >= 1
      ? [
          {
            waypoints: [
              [startBranch.lng, startBranch.lat] as [number, number],
              ...located.map((stop) => [stop.lng, stop.lat] as [number, number]),
            ],
            color: "green" as const,
            label: "Route preview",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder={
            area
              ? `Search an address in ${areaName} to add a stop`
              : "Search an address or place to add a stop"
          }
          className="h-9 w-full rounded-md border border-surface-border bg-white pl-9 pr-9 text-xs text-gray-900 outline-none focus:border-brand-secondary"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}

        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
            {suggestions.map((result) => (
              <li key={result.place_id}>
                <button
                  type="button"
                  onClick={() => pickSuggestion(result)}
                  className="flex w-full cursor-pointer items-start gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span>
                    <span className="block font-medium text-gray-900">
                      {shortName(result.display_name)}
                    </span>
                    <span className="block text-xs text-gray-500">{result.display_name}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searchError && <p className="text-xs text-red-600">{searchError}</p>}

      <div className="relative h-56 overflow-hidden rounded-md border border-gray-200">
        <SmartMap
          center={mapCenter}
          zoom={14}
          markers={markers}
          routes={mapRoutes}
          onMapClick={(position) => {
            void handleMapClick(position);
          }}
          className="h-full w-full"
        />
        <p className="pointer-events-none absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-[11px] text-gray-600 shadow-sm">
          {isPinning ? "Finding address…" : "Click the map to add a stop"}
        </p>
      </div>

      {stops.length >= 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void optimizeStops()}
            disabled={isOptimizing || !stops.every(isLocatedStop)}
            title={
              stops.every(isLocatedStop)
                ? optimizeLockedReason
                  ? "Pick the nearest branch, keeping this stop order"
                  : "Pick the nearest branch and the shortest stop order"
                : "Place every stop on the map first"
            }
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-brand"
          >
            {isOptimizing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {isOptimizing
              ? area && optimizeLockedReason === undefined
                ? "Checking every street…"
                : "Optimizing…"
              : "Optimize Checkpoints"}
          </button>
          <span className="text-[11px] text-gray-500">
            {optimizeLockedReason
              ? `${optimizeLockedReason} Starts from ${startBranch.name}.`
              : `Starts from ${startBranch.name}`}
          </span>
        </div>
      )}

      {optimizeMessage && (
        <p className="rounded-md bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-800">
          {optimizeMessage}
        </p>
      )}

      {stops.length === 0 ? (
        <p className="text-xs text-gray-500">
          No stops yet. Search for an address or click the map.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {stops.map((stop, index) => (
            <li
              key={stop.id}
              className={`flex items-start gap-2 rounded-md border px-2 py-1.5 ${
                !isLocatedStop(stop)
                  ? "border-amber-300 bg-amber-50"
                  : isOutside(stop)
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
              }`}
            >
              <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <input
                  value={stop.name}
                  onChange={(event) => renameStop(stop.id, event.target.value)}
                  aria-label={`Stop ${index + 1} name`}
                  className="w-full rounded border border-transparent px-1 py-0.5 text-sm font-medium text-gray-900 hover:border-gray-200 focus:border-gray-300"
                />
                {isLocatedStop(stop) ? (
                  <>
                    <p className="truncate px-1 text-[11px] text-gray-500" title={stop.address}>
                      {stop.address}
                    </p>
                    {isOutside(stop) && (
                      <p className="px-1 text-[11px] font-medium text-red-700">
                        Outside {areaName}
                        {area?.precision === "approximate" && " (based on an approximate area)"}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="px-1 text-[11px] text-amber-800">
                    No map location yet.{" "}
                    <button
                      type="button"
                      disabled={locatingId === stop.id}
                      onClick={() => void locateStop(stop)}
                      className="cursor-pointer font-semibold underline disabled:cursor-wait disabled:opacity-60"
                    >
                      {locatingId === stop.id ? "Finding…" : "Find on map"}
                    </button>
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => moveStop(index, -1)}
                  disabled={index === 0}
                  aria-label="Move stop up"
                  className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveStop(index, 1)}
                  disabled={index === stops.length - 1}
                  aria-label="Move stop down"
                  className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeStop(stop.id)}
                  aria-label="Remove stop"
                  className="cursor-pointer rounded p-1 text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
