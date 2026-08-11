import type { Dispatch, SetStateAction } from "react";
import { FormField } from "@bazoora/ui";
import type { Route, WasteType, CollectionDay } from "@bazoora/shared";
import { WASTE_TYPES,COLLECTION_DAYS } from "../routeFilters.constants.ts";
import type { RouteFormValue } from "../route.types.ts";
import { useEcoAideOptions } from "../../route-assignment/hooks/useEcoAideOptions";
import { getAvailableEcoAides } from "../../route-assignment/routeAssignmentApi";

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

  const waypointCount = formValue.waypoints
    .split(",")
    .map((stop) => stop.trim())
    .filter(Boolean).length;

  if (waypointCount < 1) {
    return "At least one collection point is required.";
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
  // Only flag a field once the user has put something in it — an empty,
  // untouched form shouldn't open with validation errors already showing.
  const showNameError =
    formValue.name.length > 0 && formValue.name.trim().length < 5;
  const showBarangayError =
    formValue.barangay.length > 0 && formValue.barangay.trim().length < 5;
  const waypointCount = formValue.waypoints
    .split(",")
    .map((stop) => stop.trim())
    .filter(Boolean).length;
  const showWaypointsError =
    formValue.waypoints.length > 0 && waypointCount < 1;

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

      <FormField label="Waypoints / Collection Points" required>
        <input
          value={formValue.waypoints}
          onChange={(event) => {
            updateField("waypoints", event.target.value);
          }}
          placeholder="Enter Waypoints / Collection Points (e.g. Stop A, Stop B, Stop C)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
        {showWaypointsError && (
          <p className="mt-1 text-xs text-red-600">
            At least one collection point is required.
          </p>
        )}
      </FormField>

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
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
          Fleet assignment will be available in a follow-up PR.
        </div>
      </FormField>
    </div>
  );
}
