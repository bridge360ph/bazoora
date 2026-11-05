import { Modal, ModalFooter, FormField } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";
import { useTruckOptions } from "../../route-assignment/hooks/useTruckOptions";
import {
  formatTruckWithBranch,
  getAvailableTrucks,
  getTrucksForBranch,
  getTrucksForWasteType,
  sortTrucksByBranch,
} from "../../route-assignment/routeAssignmentApi";
import { branchById, routeBranch as findRouteBranch } from "@/lib/branches";
import { formatWasteType } from "../routeFilters.constants";

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
  const freeTrucks = getAvailableTrucks(trucks, route.id);
  // Only trucks for the route's waste type and, on a weekly route, from its
  // branch. Nearest branch first.
  // Older routes with no saved branch use the branch nearest their stops.
  const routeBranch = findRouteBranch(route);
  const routeBranchId = routeBranch?.id ?? null;
  const wasteMatches = getTrucksForWasteType(freeTrucks, route.wasteType, route.assignedTruckId);
  const availableTrucks = sortTrucksByBranch(
    getTrucksForBranch(wasteMatches, route.routeType, routeBranchId, route.assignedTruckId),
    routeBranchId,
  );
  const hiddenCount = freeTrucks.length - wasteMatches.length;
  const otherBranchCount = wasteMatches.length - availableTrucks.length;
  const selectedTruck = trucks.find((truck) => truck.id === assignedTruck) ?? null;
  const selectedBranch = branchById(selectedTruck?.branchId);
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
            className="h-9 w-full rounded-md border border-surface-border bg-gray-50 px-3 text-xs text-gray-500"
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
              className="h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-900 outline-none focus:border-brand-secondary"
            >
              <option value="">Unassigned</option>

              {availableTrucks.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  {formatTruckWithBranch(truck)} · {truck.status}
                </option>
              ))}
            </select>
          )}
        </FormField>

        {!isLoading && !isError && trucks.length > 0 && (
          <div className="flex flex-col gap-1 text-xs text-gray-500">
            <p>
              Showing trucks that carry {formatWasteType(route.wasteType)} waste
              {routeBranch
                ? route.routeType === "Paid"
                  ? `, from ${routeBranch.name} first`
                  : ` from ${routeBranch.name}`
                : ""}
              .
              {otherBranchCount > 0 &&
                ` ${otherBranchCount === 1 ? "1 truck from another branch is" : `${otherBranchCount} trucks from other branches are`} hidden.`}
              {hiddenCount > 0 &&
                ` ${hiddenCount === 1 ? "1 free truck is" : `${hiddenCount} free trucks are`} hidden because ${
                  hiddenCount === 1 ? "it does" : "they do"
                } not carry this waste type.`}
            </p>
            {availableTrucks.length === 0 && (
              <p>
                No free truck matches. Register or edit a truck in Fleet Management with this
                waste type{routeBranch && route.routeType !== "Paid" ? ` and ${routeBranch.name}` : ""}.
              </p>
            )}
            {selectedTruck && selectedBranch && selectedBranch.id !== routeBranch?.id && (
              <p className="text-amber-700">
                The route path will start from {selectedBranch.name}, this truck&apos;s branch.
              </p>
            )}
            {selectedTruck && !selectedBranch && (
              <p className="text-amber-700">
                This truck has no branch yet. Set it in Fleet Management so the route path has a
                starting point.
              </p>
            )}
          </div>
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
