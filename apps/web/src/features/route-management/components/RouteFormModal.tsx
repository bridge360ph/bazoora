import type { Dispatch, SetStateAction } from "react";
import { Modal, ModalFooter } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";
import type { RouteFormValue } from "../route.types.ts";
import { RouteEntryForm, getRouteFormValidationError } from "./RouteEntryForm";

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

  const validationError = getRouteFormValidationError(formValue);
  const isFormValid = validationError === null;

  function handleSave() {
    if (isSubmitting) {
      return;
    }

    if (validationError) {
      alert(validationError);
      return;
    }

    onSave();
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  return (
    <Modal title={title} onClose={handleClose} width={560}>
      {errorMessage && (
        <p className="mb-3 text-sm text-red-600">{errorMessage}</p>
      )}

      <RouteEntryForm
        formValue={formValue}
        setFormValue={setFormValue}
        routes={routes}
        editingRouteId={route?.id}
      />

      {!isFormValid && (
        <p className="mt-3 text-sm text-gray-500">
          {validationError}
        </p>
      )}

      <ModalFooter
        saveLabel={saveLabel}
        onSave={handleSave}
        onClose={handleClose}
        saveDisabled={!isFormValid || isSubmitting}
      />
    </Modal>
  );
}
