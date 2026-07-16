import type { Dispatch, SetStateAction } from "react";
import { Modal, ModalFooter } from "@bazoora/ui";
import type { Route, RouteFormValue } from "../route.types";
import { RouteEntryForm } from "./RouteEntryForm";

type RouteFormMode = "create" | "edit";

interface RouteFormModalProps {
  mode: RouteFormMode;
  route?: Route;
  formValue: RouteFormValue;
  setFormValue: Dispatch<SetStateAction<RouteFormValue>>;
  onSave: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

/**
 * Handles both "Create Route" and "Edit Route" - the two only ever differed
 * by title and save-button label, so they share one modal instead of two
 * near-identical files.
 *
 * NOTE: `ModalFooter` is assumed to be added to @bazoora/ui - it is not
 * route-specific and has no reason to live in this feature folder.
 */
export function RouteFormModal({
  mode,
  route,
  formValue,
  setFormValue,
  onSave,
  onClose,
  isSubmitting = false,
}: RouteFormModalProps) {
  const title = mode === "create" ? "Create Route" : `Edit Route for ${route?.id}`;

  const saveLabel =
    mode === "create"
      ? isSubmitting
        ? "Creating..."
        : "Create"
      : isSubmitting
        ? "Saving..."
        : "Save";

  return (
    <Modal title={title} onClose={onClose} width={560}>
      <RouteEntryForm formValue={formValue} setFormValue={setFormValue} />
      <ModalFooter saveLabel={saveLabel} onSave={onSave} onClose={onClose} />
    </Modal>
  );
}
