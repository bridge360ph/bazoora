import type { Dispatch, SetStateAction } from "react";
import { FormField } from "@bazoora/ui";
import type { Route, WasteType, CollectionDay } from "@bazoora/shared";
import { WASTE_TYPES,COLLECTION_DAYS } from "../routeFilters.constants.ts";
import { isLocatedStop, type RouteFormValue } from "../route.types.ts";
import { RouteStopsEditor } from "./RouteStopsEditor";
import { useEcoAideOptions } from "../../route-assignment/hooks/useEcoAideOptions";
import {
  formatTruckOption,
  getAvailableEcoAides,
  getAvailableTrucks,
} from "../../route-assignment/routeAssignmentApi";
import { useTruckOptions } from "../../route-assignment/hooks/useTruckOptions";

interface RouteEntryFormProps {
  formValue: RouteFormValue;
  setFormValue: Dispatch<SetStateAction<RouteFormValue>>;
  routes: Route[];
  editingRouteId?: string;
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
): string | null {
  if (formValue.name.trim().length < 5) {
    return "Route Name must be at least 5 characters.";
  }

  if (formValue.barangay.trim().length < 5) {
    return "Barangay Coverage must be at least 5 characters.";
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

  if (!formValue.wasteType) {
    return "Waste Type is required.";
  }

  if (!formValue.collectionDay) {
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
}: RouteEntryFormProps) {

  function updateField<Key extends keyof RouteFormValue>(
    key: Key,
    value: RouteFormValue[Key],
  ) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  }

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

  // A new route has no id yet, so only free trucks are offered.
  const availableTrucks = getAvailableTrucks(trucks, editingRouteId ?? "");
  // Only flag a field once the user has put something in it — an empty,
  // untouched form shouldn't open with validation errors already showing.
  const showNameError =
    formValue.name.length > 0 && formValue.name.trim().length < 5;
  const showBarangayError =
    formValue.barangay.length > 0 && formValue.barangay.trim().length < 5;
  const unlocatedCount = formValue.stops.filter(
    (stop) => !isLocatedStop(stop),
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Route Name" required>
        <input
          value={formValue.name}
          onChange={(event) => {
            updateField("name", event.target.value);
          }}
          placeholder="Enter Route Name"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
        {showNameError && (
          <p className="mt-1 text-xs text-red-600">
            Route Name must be at least 5 characters.
          </p>
        )}
      </FormField>

      <FormField label="Barangay Coverage" required>
        <input
          value={formValue.barangay}
          onChange={(event) => {
            updateField("barangay", event.target.value);
          }}
          placeholder="Enter Barangay Coverage"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
        {showBarangayError && (
          <p className="mt-1 text-xs text-red-600">
            Barangay Coverage must be at least 5 characters.
          </p>
        )}
      </FormField>

      {/* Not a FormField: that renders a <label>, which would swallow clicks
          on the map and the stop buttons inside it. */}
      <div className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
        <span className="inline-flex items-center">
          Waypoints / Collection Points
          <span aria-hidden="true" className="ml-1 text-red-500">
            *
          </span>
        </span>
        <RouteStopsEditor
          stops={formValue.stops}
          onChange={(stops) => {
            updateField("stops", stops);
          }}
          barangay={formValue.barangay}
        />
        {unlocatedCount > 0 && (
          <p className="text-xs text-amber-700">
            {unlocatedCount === 1
              ? "1 stop has no map location yet. Use \"Find on map\" or remove it before saving."
              : `${unlocatedCount} stops have no map location yet. Use "Find on map" or remove them before saving.`}
          </p>
        )}
      </div>

      <FormField label="Waste Type">
        <select
          value={formValue.wasteType}
          onChange={(event) => {
            updateField("wasteType", event.target.value as WasteType);
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          {WASTE_TYPES.map((wasteType) => (
            <option key={wasteType} value={wasteType}>
              {wasteType}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Collection Day">
          <select
            value={formValue.collectionDay}
            onChange={(event) => {
              updateField("collectionDay", event.target.value as CollectionDay);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            {COLLECTION_DAYS.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Start Time">
          <input
            type="time"
            value={formValue.startTime}
            onChange={(event) => {
              updateField("startTime", event.target.value);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </FormField>
      </div>

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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">Unassigned</option>
              {availableTrucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {formatTruckOption(truck)} · {truck.status}
                </option>
              ))}
            </select>
            {availableTrucks.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                All trucks are already assigned to other routes.
              </p>
            )}
          </>
        )}
      </FormField>
    </div>
  );
}
