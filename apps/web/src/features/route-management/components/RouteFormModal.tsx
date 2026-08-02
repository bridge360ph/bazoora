import type { Dispatch, SetStateAction } from "react";
import { Modal, ModalFooter } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";
import type { RouteFormValue } from "../route.types.ts";
import { RouteEntryForm } from "./RouteEntryForm";

type RouteFormMode = "create" | "edit";

interface RouteFormModalProps {
  mode: RouteFormMode;
  route?: Route;
  routes: Route[];
  formValue: RouteFormValue;
  setFormValue: Dispatch<SetStateAction<RouteFormValue>>;
  onSave: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function RouteFormModal({
  mode,
  route,
  routes,
  formValue,
  setFormValue,
  onSave,
  onClose,
  isSubmitting = false,
  errorMessage = null,
}: RouteFormModalProps) {
  const title =
    mode === "create"
      ? "Create Route"
      : route
        ? `Edit Route ${route.routeDisplayNumber}`
        : "Edit Route";

  const saveLabel =
    mode === "create"
      ? isSubmitting
        ? "Creating..."
        : "Create"
      : isSubmitting
        ? "Saving..."
        : "Save";

  function getValidationError(): string | null {
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

  function handleSave() {
    const validationError = getValidationError();

    if (validationError) {
      alert(validationError);
      return;
    }

    onSave();
  }

  return (
    <Modal title={title} onClose={onClose} width={560}>
      {errorMessage && (
        <p className="mb-3 text-sm text-red-600">{errorMessage}</p>
      )}

      <RouteEntryForm
        formValue={formValue}
        setFormValue={setFormValue}
        routes={routes}
        editingRouteId={route?.id}
      />

      <ModalFooter
        saveLabel={saveLabel}
        onSave={handleSave}
        onClose={onClose}
      />
    </Modal>
  );
}
