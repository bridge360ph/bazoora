import { useState } from "react";
import { FormField, Modal, ModalFooter } from "@bazoora/ui";
import type { Truck } from "../fleet.types";

interface AssignTruckModalProps {
  truck: Truck;
  assignedRoute: string;
  setAssignedRoute: (route: string) => void;
  assignedEcoAide: string;
  setAssignedEcoAide: (ecoAide: string) => void;
  routeOptions: string[];
  ecoAideOptions: string[];
  onSave: () => void;
  onClose: () => void;
}

interface AssignmentErrors {
  assignedRoute?: string;
  assignedEcoAide?: string;
}

const inputBaseClass =
  "box-border w-full rounded-[7px] border bg-white px-[10px] py-2 text-[13px] text-gray-900 outline-none transition focus:ring-2";

export function AssignTruckModal({
  truck,
  assignedRoute,
  setAssignedRoute,
  assignedEcoAide,
  setAssignedEcoAide,
  routeOptions,
  ecoAideOptions,
  onSave,
  onClose,
}: AssignTruckModalProps) {
  const [errors, setErrors] =
    useState<AssignmentErrors>({});

  function getInputClass(hasError: boolean) {
    return `${inputBaseClass} ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : "border-gray-300 focus:border-brand focus:ring-brand/15"
    }`;
  }

  function handleSave() {
    const nextErrors: AssignmentErrors = {};

    if (!assignedRoute.trim()) {
      nextErrors.assignedRoute =
        "Assigned route is required.";
    }

    if (!assignedEcoAide.trim()) {
      nextErrors.assignedEcoAide =
        "Assigned Eco-Aide is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave();
  }

  return (
    <Modal title="Assign Truck" onClose={onClose} width={430}>
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
            className="box-border w-full rounded-[7px] border border-gray-300 bg-gray-50 px-[10px] py-2 text-[13px] text-gray-500"
          />

          <input
            value={truck.model}
            disabled
            className="box-border w-full rounded-[7px] border border-gray-300 bg-gray-50 px-[10px] py-2 text-[13px] text-gray-500"
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

          {routeOptions
            .filter((route) => route.trim().length > 0)
            .map((route) => (
              <option key={route} value={route}>
                {route}
              </option>
            ))}
        </select>
      </FormField>

      <FormField
        label="Assigned Eco-Aide ID"
        required
        error={errors.assignedEcoAide}
      >
        <select
          value={assignedEcoAide}
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
          <option value="">Select Eco-Aide</option>

          {ecoAideOptions
            .filter(
              (ecoAide) =>
                ecoAide.trim().length > 0,
            )
            .map((ecoAide) => (
              <option key={ecoAide} value={ecoAide}>
                {ecoAide}
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
