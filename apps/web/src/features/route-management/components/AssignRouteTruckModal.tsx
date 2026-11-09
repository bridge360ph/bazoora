import { Modal, ModalFooter, FormField } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";
import { useTruckOptions } from "../../route-assignment/hooks/useTruckOptions";
import {
  formatTruckOption,
  getAvailableTrucks,
} from "../../route-assignment/routeAssignmentApi";

interface AssignRouteTruckModalProps {
  route: Route;
  assignedTruck: string | null;
  setAssignedTruck: (truckId: string | null) => void;
  onSave: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

/**
 * Picks the truck that serves a route, opened from the "Assign Truck" button
 * on a route card. Choosing "Unassigned" takes the current truck off the
 * route.
 */
export function AssignRouteTruckModal({
  route,
  assignedTruck,
  setAssignedTruck,
  onSave,
  onClose,
  isSubmitting = false,
  errorMessage = null,
}: AssignRouteTruckModalProps) {
  const saveLabel = isSubmitting ? "Saving..." : "Save";

  const { trucks, isLoading, isError } = useTruckOptions();
  const availableTrucks = getAvailableTrucks(trucks, route.id);
  const hasChanged = assignedTruck !== route.assignedTruckId;

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  function handleSave() {
    if (isSubmitting || !hasChanged) {
      return;
    }

    onSave();
  }

  return (
    <Modal
      title={`Assign truck to ${route.routeDisplayNumber}`}
      onClose={handleClose}
      width={560}
    >
      {errorMessage && (
        <p className="mb-3 text-sm text-red-600">{errorMessage}</p>
      )}

      <div className="flex flex-col gap-4">
        <FormField label="Route">
          <input
            value={route.name}
            disabled
            readOnly
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600"
          />
        </FormField>

        <FormField label="Select Truck">
          {isError ? (
            <p className="text-sm text-red-600">
              Failed to load trucks. Please try again.
            </p>
          ) : isLoading ? (
            <p className="text-sm text-gray-500">Loading trucks…</p>
          ) : trucks.length === 0 ? (
            <p className="text-sm text-gray-500">
              No trucks exist yet. Register one in Fleet Management.
            </p>
          ) : (
            <select
              value={assignedTruck ?? ""}
              onChange={(event) => {
                setAssignedTruck(event.target.value || null);
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
          )}
        </FormField>

        {!isLoading &&
          !isError &&
          trucks.length > 0 &&
          availableTrucks.length === 0 && (
            <p className="text-xs text-gray-500">
              All trucks are already assigned to other routes.
            </p>
          )}
      </div>

      <ModalFooter
        saveLabel={saveLabel}
        onSave={handleSave}
        onClose={handleClose}
        saveDisabled={isSubmitting || !hasChanged}
      />
    </Modal>
  );
}
