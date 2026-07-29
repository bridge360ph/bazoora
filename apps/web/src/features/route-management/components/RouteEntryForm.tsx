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
        ) : availableEcoAides.length === 0 ? (
          <p className="text-sm text-gray-500">
            No available Eco-Aides right now.
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
                {ecoAide.name}
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
