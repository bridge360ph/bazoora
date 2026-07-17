import type { Dispatch, SetStateAction } from "react";
import { FormField } from "@bazoora/ui";
import {
  COLLECTION_DAYS,
  ECO_AIDE_OPTIONS,
  FLEET_OPTIONS,
  WASTE_TYPES,
} from "../route.mockData";
import type {
  CollectionDay,
  RouteFormValue,
  WasteType,
} from "../../../types/route.types";

interface RouteEntryFormProps {
  formValue: RouteFormValue;
  setFormValue: Dispatch<SetStateAction<RouteFormValue>>;
}

/**
 * The actual set of inputs for creating/editing a route. Rendered inside
 * RouteFormModal for both the "create" and "edit" modes so they stay in sync.
 *
 * NOTE: `FormField` is assumed to be added to @bazoora/ui - it is not
 * route-specific and has no reason to live in this feature folder.
 */
export function RouteEntryForm({ formValue, setFormValue }: RouteEntryFormProps) {
  function updateField<Key extends keyof RouteFormValue>(
    key: Key,
    value: RouteFormValue[Key],
  ) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Route Name">
        <input
          value={formValue.name}
          onChange={(event) => {
            updateField("name", event.target.value);
          }}
          placeholder="e.g. Brgy. Poblacion Loop"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
      </FormField>

      <FormField label="Barangay coverage">
        <input
          value={formValue.barangay}
          onChange={(event) => {
            updateField("barangay", event.target.value);
          }}
          placeholder="e.g. Brgy. Poblacion"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
      </FormField>

      <FormField label="Waypoints / collection points">
        <input
          value={formValue.waypoints}
          onChange={(event) => {
            updateField("waypoints", event.target.value);
          }}
          placeholder="e.g. Stop A, Stop B, Stop C"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        />
      </FormField>

      <FormField label="Waste type">
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
        <FormField label="Collection day">
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
            value={formValue.startTime}
            onChange={(event) => {
              updateField("startTime", event.target.value);
            }}
            placeholder="e.g. 10:00 AM"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </FormField>
      </div>

      <FormField label="Eco-Aide">
        <select
          value={formValue.ecoAide}
          onChange={(event) => {
            updateField("ecoAide", event.target.value);
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          {ECO_AIDE_OPTIONS.map((ecoAide) => (
            <option key={ecoAide} value={ecoAide}>
              {ecoAide}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Fleet Assignment">
        <select
          value={formValue.fleetAssignment}
          onChange={(event) => {
            updateField("fleetAssignment", event.target.value);
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
        >
          {FLEET_OPTIONS.map((fleet) => (
            <option key={fleet} value={fleet}>
              {fleet}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
