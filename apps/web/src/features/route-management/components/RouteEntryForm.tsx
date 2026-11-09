import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { LoaderCircle } from "lucide-react";
import { FormField } from "@bazoora/ui";
import type { Route, WasteType, CollectionDay } from "@bazoora/shared";
import {
  COLLECTION_DAYS,
  WASTE_TYPE_LABELS,
  WASTE_TYPES,
} from "../routeFilters.constants.ts";
import {
  barangayNameOf,
  buildFreeRouteName,
  findScheduleClash,
  formatStartTime,
  isLocatedStop,
  sameBarangay,
  type RouteFormValue,
} from "../route.types.ts";
import { isInsideArea, type AreaBoundary } from "@/lib/area";
import { generateBarangayStops } from "@/lib/barangayStops";
import { BRANCHES, branchById } from "@/lib/branches";
import { nearestBranchId } from "@bazoora/shared";
import { RouteStopsEditor } from "./RouteStopsEditor";
import { BarangayPicker } from "./BarangayPicker";
import { useEcoAideOptions } from "../../route-assignment/hooks/useEcoAideOptions";
import {
  formatTruckWithBranch,
  getAvailableEcoAides,
  getAvailableTrucks,
  getTrucksForBranch,
  getTrucksForWasteType,
  sortTrucksByBranch,
} from "../../route-assignment/routeAssignmentApi";
import { useTruckOptions } from "../../route-assignment/hooks/useTruckOptions";

interface RouteEntryFormProps {
  formValue: RouteFormValue;
  setFormValue: Dispatch<SetStateAction<RouteFormValue>>;
  routes: Route[];
  editingRouteId?: string;
  /** The outline of the barangay a weekly route covers, once found. */
  area: AreaBoundary | null;
  isAreaLoading: boolean;
  areaNotFound: boolean;
}

interface ValidationContext {
  routes: Route[];
  editingRouteId?: string | undefined;
  area: AreaBoundary | null;
}

/**
 * Single source of truth for client-side validation, reused by
 * RouteFormModal to decide when Save/Create should be enabled and as the
 * final guard on submit. Mirrors validateRouteFields in
 * routeManagementService.ts — the backend remains the source of truth,
 * this only avoids a round-trip for obviously-invalid input.
 */
export function getRouteFormValidationError(
  formValue: RouteFormValue,
  context: ValidationContext,
): string | null {
  const isFree = formValue.routeType !== "Paid";

  if (isFree) {
    // Checked in this order: barangay, waste type, collection day, start time.
    if (!formValue.barangay.trim()) {
      return "Pick the barangay this route covers.";
    }

    if (!formValue.wasteType) {
      return "Waste Type is required.";
    }

    if (!formValue.collectionDay) {
      return "Collection Day is required.";
    }

    if (!formValue.startTime.trim()) {
      return "Start Time is required.";
    }

    const clash = findScheduleClash(formValue, context.routes, context.editingRouteId);

    if (clash) {
      return `${barangayNameOf(formValue.barangay)} already has a ${WASTE_TYPE_LABELS[formValue.wasteType]} route every ${formValue.collectionDay} at ${formatStartTime(formValue.startTime)} (${clash.routeDisplayNumber}). Change the waste type, collection day or start time.`;
    }

    if (formValue.stops.length < 1) {
      return "Collection points are still being generated. Wait a moment, or add a stop by hand.";
    }
  } else {
    if (formValue.name.trim().length < 5) {
      return "Route Name must be at least 5 characters.";
    }

    if (formValue.barangay.trim().length < 5) {
      return "Barangay Coverage must be at least 5 characters.";
    }
  }

  if (formValue.stops.length < 1) {
    return "At least one collection point is required.";
  }

  if (formValue.stops.some((stop) => !stop.name.trim())) {
    return "Every collection point needs a name.";
  }

  if (!formValue.stops.every(isLocatedStop)) {
    return "Find each collection point on the map, or remove it.";
  }

  const { area } = context;

  if (
    isFree &&
    area?.precision === "boundary" &&
    formValue.stops.some(
      (stop) => isLocatedStop(stop) && !isInsideArea(area, [stop.lat, stop.lng]),
    )
  ) {
    return `Every stop must be inside ${barangayNameOf(formValue.barangay)}. Move or remove the stops marked in red.`;
  }

  if (!formValue.wasteType) {
    return "Waste Type is required.";
  }

  if (formValue.routeType === "Paid") {
    if (!formValue.collectionDate) {
      return "Collection Date is required for a paid route.";
    }
  } else if (!formValue.collectionDay) {
    return "Collection Day is required.";
  }

  if (!formValue.startTime.trim()) {
    return "Start Time is required.";
  }

  if (!formValue.routeType.trim()) {
    return "Route Type is required.";
  }

  return null;
}

/**
 * The actual set of inputs for creating/editing a route. Rendered inside
 * RouteFormModal for both the "create" and "edit" modes so they stay in sync.
 *
 * NOTE: `FormField` is assumed to be added to @bazoora/ui - it is not
 * route-specific and has no reason to live in this feature folder.
 */
export function RouteEntryForm({
  formValue,
  setFormValue,
  routes,
  editingRouteId,
  area,
  isAreaLoading,
  areaNotFound,
}: RouteEntryFormProps) {
  const isFree = formValue.routeType !== "Paid";

  // A weekly route is named after its barangay, day and start time.
  function updateField<Key extends keyof RouteFormValue>(
    key: Key,
    value: RouteFormValue[Key],
  ) {
    setFormValue((currentValue) => {
      const next = { ...currentValue, [key]: value };

      // The route path starts from the picked truck's branch.
      if (key === "assignedTruckId") {
        const truckBranch = trucks.find((truck) => truck.id === value)?.branchId;
        if (branchById(truckBranch)) next.startBranchId = truckBranch ?? null;
      }

      // A truck that does not carry the new waste type is taken off.
      if (key === "wasteType" && next.assignedTruckId) {
        const truck = trucks.find((option) => option.id === next.assignedTruckId);
        if (truck && truck.wasteType !== value) {
          next.assignedTruckId = null;
        }
      }

      if (next.routeType === "Paid") return next;

      return {
        ...next,
        // A new barangay gets its own collection points and branch.
        ...(key === "barangay" &&
          value !== currentValue.barangay && { stops: [], waypoints: "", startBranchId: null }),
        name: buildFreeRouteName(
          next.barangay,
          next.wasteType,
          next.collectionDay,
          next.startTime,
        ),
      };
    });
  }

  // Collection points generated from the barangay's streets.
  const [generation, setGeneration] = useState<{
    forArea: string;
    status: "idle" | "loading" | "streets" | "center" | "error";
    count: number;
    branchName: string | null;
  }>({ forArea: "", status: "idle", count: 0, branchName: null });
  // Empty while the barangay outline is loading, so the previous barangay's
  // outline is never used for the new one.
  const areaKey =
    isFree && area && !isAreaLoading ? `${formValue.barangay}|${area.center.join(",")}` : "";
  // The barangay currently picked. A generation started for an earlier one
  // is dropped when it finishes.
  const latestAreaKeyRef = useRef(areaKey);
  useEffect(() => {
    latestAreaKeyRef.current = areaKey;
  }, [areaKey]);
  const currentGeneration =
    generation.forArea === areaKey
      ? generation
      : { forArea: areaKey, status: "idle" as const, count: 0, branchName: null };

  async function generateStops() {
    if (!area || !areaKey) return;

    const forArea = areaKey;
    setGeneration({ forArea, status: "loading", count: 0, branchName: null });

    try {
      const result = await generateBarangayStops(area, formValue.barangay, routeBranch);
      // The barangay was changed while this one was loading.
      if (latestAreaKeyRef.current !== forArea) return;
      const stamp = Date.now().toString(36);

      setFormValue((current) => ({
        ...current,
        stops: result.stops.map((stop, index) => ({
          id: `gen-${stamp}-${index}`,
          ...stop,
        })),
        startBranchId: result.branch?.id ?? current.startBranchId,
      }));
      setGeneration({
        forArea,
        status: result.source,
        count: result.stops.length,
        branchName: result.branch?.name ?? null,
      });
    } catch {
      if (latestAreaKeyRef.current !== forArea) return;
      setGeneration({ forArea, status: "error", count: 0, branchName: null });
    }
  }

  function resetStops() {
    setFormValue((current) => ({ ...current, stops: [], waypoints: "" }));
    setGeneration({ forArea: areaKey, status: "idle", count: 0, branchName: null });
  }

  const isPreparingStops =
    isFree &&
    formValue.barangay !== "" &&
    (isAreaLoading || currentGeneration.status === "loading");

  // A new route generates its collection points once its barangay is found.
  // Routes that already have stops keep them until Regenerate is clicked.
  useEffect(() => {
    if (!areaKey || formValue.stops.length > 0 || generation.forArea === areaKey) return;
    const timer = setTimeout(() => {
      void generateStops();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaKey]);

  const {
    ecoAides,
    isLoading: ecoAidesLoading,
    isError: ecoAidesErrored,
  } = useEcoAideOptions();

  const availableEcoAides = getAvailableEcoAides(
    ecoAides,
    routes,
    editingRouteId,
  );

  const {
    trucks,
    isLoading: trucksLoading,
    isError: trucksErrored,
  } = useTruckOptions();

  // A new route has no id yet, so only free trucks are offered. Of those,
  // only trucks carrying the route's waste type, nearest branch first.
  const freeTrucks = getAvailableTrucks(trucks, editingRouteId ?? "");
  const wasteMatches = getTrucksForWasteType(
    freeTrucks,
    formValue.wasteType,
    formValue.assignedTruckId,
  );
  const selectedTruck = trucks.find((truck) => truck.id === formValue.assignedTruckId);
  const truckBranch = branchById(selectedTruck?.branchId);
  // A weekly route is run from its saved branch. Without one, the branch
  // nearest its barangay (or its stops until the barangay is found) is used.
  // This is the same order the API and the Assign Truck window use. Only
  // trucks from that branch are offered.
  const areaBranch =
    isFree && area
      ? branchById(nearestBranchId([{ lat: area.center[0], lng: area.center[1] }], BRANCHES))
      : null;
  const stopsBranch = branchById(
    nearestBranchId(
      formValue.stops.filter(isLocatedStop).map((stop) => ({ lat: stop.lat, lng: stop.lng })),
      BRANCHES,
    ),
  );
  const savedBranch = branchById(formValue.startBranchId);
  const effectiveBranchId = (savedBranch ?? areaBranch ?? stopsBranch)?.id ?? null;
  // The garage the route path starts from: the truck's branch once a truck
  // is picked, otherwise the route's branch.
  const routeBranch = truckBranch ?? branchById(effectiveBranchId);
  const availableTrucks = sortTrucksByBranch(
    getTrucksForBranch(
      wasteMatches,
      formValue.routeType,
      effectiveBranchId,
      formValue.assignedTruckId,
    ),
    effectiveBranchId,
  );
  const hiddenTruckCount = freeTrucks.length - wasteMatches.length;
  const otherBranchTruckCount = wasteMatches.length - availableTrucks.length;
  const routeBranchId = routeBranch?.id ?? null;

  // Keep the saved branch in step with the route's branch.
  useEffect(() => {
    if (!routeBranchId || formValue.startBranchId === routeBranchId) return;
    const timer = setTimeout(() => {
      setFormValue((current) => ({ ...current, startBranchId: routeBranchId }));
    }, 0);
    return () => clearTimeout(timer);
  }, [routeBranchId, formValue.startBranchId, setFormValue]);
  // Only flag a field once the user has put something in it — an empty,
  // untouched form shouldn't open with validation errors already showing.
  const showNameError =
    formValue.name.length > 0 && formValue.name.trim().length < 5;
  const showBarangayError =
    formValue.barangay.length > 0 && formValue.barangay.trim().length < 5;
  const unlocatedCount = formValue.stops.filter(
    (stop) => !isLocatedStop(stop),
  ).length;

  // Start times already used by weekly routes in this barangay with this
  // waste type, per collection day.
  const takenByDay = new Map<string, string[]>();

  if (isFree && formValue.barangay) {
    for (const route of routes) {
      if (
        route.id !== editingRouteId &&
        route.routeType !== "Paid" &&
        route.wasteType === formValue.wasteType &&
        sameBarangay(route.barangay, formValue.barangay)
      ) {
        const times = takenByDay.get(route.collectionDay) ?? [];
        times.push(`${formatStartTime(route.startTime)} (${route.routeDisplayNumber})`);
        takenByDay.set(route.collectionDay, times);
      }
    }
  }

  const takenToday = takenByDay.get(formValue.collectionDay) ?? [];
  const clash = isFree ? findScheduleClash(formValue, routes, editingRouteId) : null;

  // Not a FormField: that renders a <label>, which would swallow clicks on
  // the map and the stop buttons inside it.
  const waypointsBlock = (
    <div className="flex flex-col gap-1.5 text-xs font-medium text-gray-700 [&>span:first-child]:text-[10px] [&>span:first-child]:font-semibold [&>span:first-child]:tracking-wider [&>span:first-child]:text-gray-400 [&>span:first-child]:uppercase">
      <span className="inline-flex items-center justify-between gap-2">
        <span>
          {isFree ? "Collection Points" : "Waypoints / Collection Points"}
          <span aria-hidden="true" className="ml-1 text-red-500">
            *
          </span>
        </span>
        <span className="inline-flex items-center gap-3">
          {formValue.stops.length > 0 && (
            <button
              type="button"
              onClick={resetStops}
              disabled={isPreparingStops}
              className="cursor-pointer text-xs font-semibold text-red-600 hover:underline disabled:cursor-wait disabled:opacity-60"
            >
              Reset collection points
            </button>
          )}
          {isFree && areaKey && (
            <button
              type="button"
              onClick={() => void generateStops()}
              disabled={isPreparingStops}
              className="cursor-pointer text-xs font-semibold text-brand hover:underline disabled:cursor-wait disabled:opacity-60"
            >
              {formValue.stops.length > 0 ? "Regenerate from barangay" : "Generate from barangay"}
            </button>
          )}
        </span>
      </span>
      {isFree && (
        <p className="text-xs font-normal text-gray-500">
          {!formValue.barangay
            ? "Pick a barangay. Its streets become the collection points automatically."
            : isAreaLoading
              ? `Finding ${barangayNameOf(formValue.barangay)} on the map...`
              : currentGeneration.status === "loading"
              ? `Finding the streets in ${barangayNameOf(formValue.barangay)}...`
              : currentGeneration.status === "error"
                ? "The streets could not be loaded. Try Regenerate, or add stops by hand."
                : currentGeneration.status === "center"
                  ? "No named streets were found, so the barangay centre was added. Add more stops by hand if needed."
                  : currentGeneration.status === "streets"
                    ? `${currentGeneration.count} collection points from the streets of ${barangayNameOf(formValue.barangay)}${
                        currentGeneration.branchName ? `, ordered from ${currentGeneration.branchName}` : ""
                      }. You can still add, move or remove stops.`
                    : "Collection points come from the barangay's streets. You can still add, move or remove stops."}
        </p>
      )}
      <div className="relative">
      {isPreparingStops && (
        <div
          role="status"
          className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-2 rounded-md bg-white/85 text-sm font-medium text-gray-700"
        >
          <LoaderCircle className="h-6 w-6 animate-spin text-brand" aria-hidden="true" />
          {isAreaLoading
            ? `Finding ${barangayNameOf(formValue.barangay)} on the map...`
            : `Generating collection points for ${barangayNameOf(formValue.barangay)}...`}
        </div>
      )}
      <RouteStopsEditor
        // A new barangay starts the editor fresh, without the old path or summary.
        key={formValue.barangay}
        stops={formValue.stops}
        onChange={(stops) => {
          updateField("stops", stops);
        }}
        barangay={formValue.barangay}
        startBranch={routeBranch}
        onPlannedBranchChange={(branch) => {
          updateField("startBranchId", branch.id);
        }}
        {...(isFree && {
          area: areaKey ? area : null,
          areaName: barangayNameOf(formValue.barangay) || "the barangay",
        })}
      />
      </div>
      {unlocatedCount > 0 && (
        <p className="text-xs text-amber-700">
          {unlocatedCount === 1
            ? "1 stop has no map location yet. Use \"Find on map\" or remove it before saving."
            : `${unlocatedCount} stops have no map location yet. Use "Find on map" or remove them before saving.`}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {isFree ? (
        <div className="flex flex-col gap-1.5 text-xs font-medium text-gray-700 [&>span:first-child]:text-[10px] [&>span:first-child]:font-semibold [&>span:first-child]:tracking-wider [&>span:first-child]:text-gray-400 [&>span:first-child]:uppercase">
          <span>Route Name</span>
          <p className="rounded-md bg-gray-50 px-3 py-2.5 text-xs font-normal text-gray-700">
            {formValue.name || "Named after the barangay, collection day and start time"}
          </p>
        </div>
      ) : (
      <FormField label="Route Name" required>
        <input
          value={formValue.name}
          onChange={(event) => {
            updateField("name", event.target.value);
          }}
          placeholder="Enter Route Name"
          className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-secondary"
        />
        {showNameError && (
          <p className="mt-1 text-xs text-red-600">
            Route Name must be at least 5 characters.
          </p>
        )}
      </FormField>
      )}

      {isFree ? (
        // Not a FormField: that renders a <label> around the pickers.
        <div className="flex flex-col gap-1.5 text-xs font-medium text-gray-700 [&>span:first-child]:text-[10px] [&>span:first-child]:font-semibold [&>span:first-child]:tracking-wider [&>span:first-child]:text-gray-400 [&>span:first-child]:uppercase">
          <span>
            Barangay Coverage
            <span aria-hidden="true" className="ml-1 text-red-500">*</span>
          </span>
          <BarangayPicker
            value={formValue.barangay}
            onChange={(label) => {
              updateField("barangay", label);
            }}
          />
          {isAreaLoading && (
            <p className="text-xs font-normal text-gray-500">Finding the barangay on the map...</p>
          )}
          {areaNotFound && (
            <p className="text-xs font-normal text-amber-700">
              The barangay outline was not found on the map, so stops are not checked against it.
            </p>
          )}
          {area?.precision === "approximate" && (
            <p className="text-xs font-normal text-amber-700">
              Only the centre of this barangay is on the map. Stops more than about 1.5 km away
              are marked, but they do not block saving.
            </p>
          )}
        </div>
      ) : (
      <FormField label="Barangay Coverage" required>
        <input
          value={formValue.barangay}
          onChange={(event) => {
            updateField("barangay", event.target.value);
          }}
          placeholder="Enter Barangay Coverage"
          className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-secondary"
        />
        {showBarangayError && (
          <p className="mt-1 text-xs text-red-600">
            Barangay Coverage must be at least 5 characters.
          </p>
        )}
      </FormField>
      )}

      {!isFree && waypointsBlock}

      <FormField label="Waste Type">
        <select
          value={formValue.wasteType}
          onChange={(event) => {
            updateField("wasteType", event.target.value as WasteType);
          }}
          className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-secondary"
        >
          {WASTE_TYPES.map((wasteType) => (
            <option key={wasteType} value={wasteType}>
              {WASTE_TYPE_LABELS[wasteType]}
            </option>
          ))}
        </select>
      </FormField>

      {/* Chosen when the route is created and not changed afterwards: a Paid
          route belongs to one hauling request. */}
      <div className="flex flex-col gap-1.5 text-xs font-medium text-gray-700 [&>span:first-child]:text-[10px] [&>span:first-child]:font-semibold [&>span:first-child]:tracking-wider [&>span:first-child]:text-gray-400 [&>span:first-child]:uppercase">
        <span>Route Type</span>
        <p className="rounded-md bg-gray-50 px-3 py-2.5 text-xs font-normal text-gray-700">
          {formValue.routeType === "Paid"
            ? "Paid · One-time collection for a hauling request"
            : "Free · Weekly garbage day route"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {formValue.routeType === "Paid" ? (
          <FormField label="Collection Date" required>
            <input
              type="date"
              value={formValue.collectionDate}
              onChange={(event) => {
                updateField("collectionDate", event.target.value);
              }}
              className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-secondary"
            />
          </FormField>
        ) : (
          <FormField label="Collection Day">
            <select
              value={formValue.collectionDay}
              onChange={(event) => {
                updateField("collectionDay", event.target.value as CollectionDay);
              }}
              className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-secondary"
            >
              {COLLECTION_DAYS.map((day) => {
                const taken = takenByDay.get(day);

                return (
                  <option key={day} value={day}>
                    {taken ? `${day} · taken at ${taken.join(", ")}` : day}
                  </option>
                );
              })}
            </select>
          </FormField>
        )}

        <FormField label="Start Time">
          <input
            type="time"
            value={formValue.startTime}
            onChange={(event) => {
              updateField("startTime", event.target.value);
            }}
            className={`w-full rounded-md border px-3 py-2 text-sm text-gray-900 ${
              clash ? "border-red-400" : "border-gray-300"
            }`}
          />
          {clash ? (
            <p className="mt-1 text-xs text-red-600">
              Taken by {clash.routeDisplayNumber}. Pick another time.
            </p>
          ) : (
            isFree &&
            takenToday.length > 0 && (
              <p className="mt-1 text-xs text-amber-700">
                Already taken on {formValue.collectionDay}: {takenToday.join(", ")}.
              </p>
            )
          )}
        </FormField>
      </div>

      {isFree && waypointsBlock}

      <FormField label="Eco-Aide">
        {ecoAidesErrored ? (
          <p className="text-sm text-red-600">
            Failed to load Eco-Aides. Please try again.
          </p>
        ) : ecoAidesLoading ? (
          <p className="text-sm text-gray-500">Loading Eco-Aides…</p>
        ) : ecoAides.length === 0 ? (
          <p className="text-sm text-gray-500">
            No Eco-Aides exist yet.
          </p>
        ) : availableEcoAides.length === 0 ? (
          <p className="text-sm text-gray-500">
            All Eco-Aides are already assigned to other routes.
          </p>
        ) : (
          <select
            value={formValue.assignedEcoAideId ?? ""}
            onChange={(event) => {
              updateField("assignedEcoAideId", event.target.value || null);
            }}
            className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-secondary"
          >
            <option value="">Unassigned</option>
            {availableEcoAides.map((ecoAide) => (
              <option key={ecoAide.id} value={ecoAide.id}>
                {ecoAide.userNumber} - {ecoAide.name}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField label="Fleet Assignment">
        {trucksErrored ? (
          <p className="text-sm text-red-600">
            Failed to load trucks. Please try again.
          </p>
        ) : trucksLoading ? (
          <p className="text-sm text-gray-500">Loading trucks…</p>
        ) : trucks.length === 0 ? (
          <p className="text-sm text-gray-500">
            No trucks exist yet. Register one in Fleet Management.
          </p>
        ) : (
          <>
            <select
              value={formValue.assignedTruckId ?? ""}
              onChange={(event) => {
                updateField("assignedTruckId", event.target.value || null);
              }}
              className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-secondary"
            >
              <option value="">Unassigned</option>
              {availableTrucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {formatTruckWithBranch(truck)} · {truck.status}
                </option>
              ))}
            </select>
            {availableTrucks.length === 0 ? (
              <p className="mt-1 text-xs text-gray-500">
                {freeTrucks.length === 0
                  ? "All trucks are already assigned to other routes."
                  : routeBranch && formValue.routeType !== "Paid"
                    ? `No free truck from ${routeBranch.name} carries this waste type.`
                    : "No free truck carries this waste type. Add it to a truck in Fleet Management."}
              </p>
            ) : (
              hiddenTruckCount > 0 && (
                <p className="mt-1 text-xs font-normal text-gray-500">
                  {hiddenTruckCount === 1 ? "1 free truck is" : `${hiddenTruckCount} free trucks are`}{" "}
                  hidden because {hiddenTruckCount === 1 ? "it does" : "they do"} not carry this
                  waste type.
                </p>
              )
            )}
            {otherBranchTruckCount > 0 && routeBranch && (
              <p className="mt-1 text-xs font-normal text-gray-500">
                This route is run from {routeBranch.name}.{" "}
                {otherBranchTruckCount === 1
                  ? "1 truck from another branch is"
                  : `${otherBranchTruckCount} trucks from other branches are`}{" "}
                hidden.
              </p>
            )}
            {selectedTruck && !truckBranch && (
              <p className="mt-1 text-xs text-amber-700">
                This truck has no branch yet. Set it in Fleet Management so the route path has a
                starting point.
              </p>
            )}
          </>
        )}
      </FormField>
    </div>
  );
}
