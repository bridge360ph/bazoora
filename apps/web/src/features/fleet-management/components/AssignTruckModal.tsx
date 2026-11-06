import { useState } from "react";
import { FormField, Modal, ModalFooter } from "@bazoora/ui";
import type { FleetAssignmentOption, Truck } from "../fleet.types";
import { branchById } from "@/lib/branches";

interface AssignTruckModalProps {
  truck: Truck;
  assignedRoute: string;
  setAssignedRoute: (route: string) => void;
  assignedEcoAide: string;
  setAssignedEcoAide: (ecoAide: string) => void;
  routeOptions: FleetAssignmentOption[];
  ecoAideOptions: FleetAssignmentOption[];
  /** Shown inside the window when saving fails. */
  errorMessage?: string;
  onSave: () => void;
  onClose: () => void;
}

interface AssignmentErrors {
  assignedRoute?: string;
  assignedEcoAide?: string;
}

const inputBaseClass =
  "h-9 w-full rounded-md border bg-white px-3 text-xs text-gray-900 outline-none transition focus:ring-2";

export function AssignTruckModal({
  truck,
  assignedRoute,
  setAssignedRoute,
  assignedEcoAide,
  setAssignedEcoAide,
  routeOptions,
  ecoAideOptions,
  errorMessage = "",
  onSave,
  onClose,
}: AssignTruckModalProps) {
  const [errors, setErrors] =
    useState<AssignmentErrors>({});
  const truckBranch = branchById(truck.branchId);
  // Only routes for this truck's waste type, and weekly routes run from its
  // branch. Paid routes start from the truck's own branch, so any branch works.
  const sameWaste = (route: FleetAssignmentOption) =>
    !route.wasteType || truck.wasteType === route.wasteType;
  // startBranchId comes from the API: the saved branch, or for older routes
  // the branch nearest their stops. A weekly route with neither is hidden.
  const sameBranch = (route: FleetAssignmentOption) =>
    route.routeType === "Paid" ||
    (truckBranch !== null && route.startBranchId === truckBranch.id);
  const matchingRoutes = truckBranch
    ? routeOptions.filter(
        (route) => route.id === truck.assignedRouteId || (sameWaste(route) && sameBranch(route)),
      )
    : routeOptions.filter((route) => route.id === truck.assignedRouteId);
  const otherBranchCount = routeOptions.filter(
    (route) => route.id !== truck.assignedRouteId && sameWaste(route) && !sameBranch(route),
  ).length;
  const otherWasteCount = routeOptions.filter(
    (route) => route.id !== truck.assignedRouteId && !sameWaste(route),
  ).length;

  function getInputClass(hasError: boolean) {
    return `${inputBaseClass} ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : "border-surface-border focus:border-brand-secondary focus:ring-brand/10"
    }`;
  }

  function handleSave() {
    const nextErrors: AssignmentErrors = {};

    if (!assignedRoute.trim()) {
      nextErrors.assignedRoute =
        "Assigned route is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave();
  }

  return (
    <Modal title="Assign Truck" onClose={onClose} width={430}>
      {errorMessage && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {errorMessage}
        </p>
      )}
      <p className="mb-4 text-xs text-gray-500">
        Fields marked with{" "}
        <span className="font-bold text-red-600">*</span>{" "}
        are required.
      </p>

      <FormField label="Truck ID">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={truck.id}
            disabled
            className="h-9 w-full rounded-md border border-surface-border bg-gray-50 px-3 text-xs text-gray-500"
          />

          <input
            value={truck.model}
            disabled
            className="h-9 w-full rounded-md border border-surface-border bg-gray-50 px-3 text-xs text-gray-500"
          />
        </div>
      </FormField>

      <FormField
        label="Assigned Route ID"
        required
        error={errors.assignedRoute}
      >
        <select
          value={assignedRoute}
          aria-invalid={Boolean(errors.assignedRoute)}
          onChange={(event) => {
            setAssignedRoute(event.target.value);

            setErrors((currentErrors) => ({
              ...currentErrors,
              assignedRoute: undefined,
            }));
          }}
          className={getInputClass(
            Boolean(errors.assignedRoute),
          )}
        >
          <option value="">Select route</option>

          {matchingRoutes.map((route) => (
            <option key={route.id} value={route.id}>
              {route.label}
            </option>
          ))}
        </select>
        <span className="text-[11px] font-normal text-gray-500 mb-3">
          {truckBranch
            ? `Showing routes run from ${truckBranch.name} for this truck's waste type.`
            : "Set this truck's branch and waste type with Edit before assigning it to a route."}
          {truckBranch && otherBranchCount > 0 &&
            ` ${otherBranchCount === 1 ? "1 route from another branch is" : `${otherBranchCount} routes from other branches are`} hidden.`}
          {truckBranch && matchingRoutes.length === 0 &&
            ` No route matches yet. Create one in Route Management.`}
          {truckBranch && otherWasteCount > 0 &&
            ` ${otherWasteCount === 1 ? "1 route for another waste type is" : `${otherWasteCount} routes for other waste types are`} hidden.`}
        </span>
      </FormField>

      <FormField
        label="Assigned Eco-Aide ID (not yet available)"
        error={errors.assignedEcoAide}
      >
        <select
          value={assignedEcoAide}
          // Eco-Aide assignment is not built yet.
          disabled
          aria-invalid={Boolean(errors.assignedEcoAide)}
          onChange={(event) => {
            setAssignedEcoAide(event.target.value);

            setErrors((currentErrors) => ({
              ...currentErrors,
              assignedEcoAide: undefined,
            }));
          }}
          className={getInputClass(
            Boolean(errors.assignedEcoAide),
          )}
        >
          <option value="">Eco-Aide assignment is not created yet</option>

          {ecoAideOptions.map((ecoAide) => (
            <option key={ecoAide.id} value={ecoAide.id}>
              {ecoAide.label}
            </option>
          ))}
        </select>
      </FormField>

      <ModalFooter
        saveLabel="Save"
        onSave={handleSave}
        onClose={onClose}
      />
    </Modal>
  );
}



