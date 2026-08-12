import { Modal, ModalFooter, FormField } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";
import { useEcoAideOptions } from "../../route-assignment/hooks/useEcoAideOptions";
import { getAvailableEcoAides } from "../../route-assignment/routeAssignmentApi";

interface AssignEcoAideModalProps {
  route: Route;
  routes: Route[];
  assignedEcoAide: string | null;
  setAssignedEcoAide: (ecoAideId: string | null) => void;
  onSave: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

/**
 * Quick single-field assignment modal, opened from the "Assign Eco-Aide"
 * button on a route card. Separate from the Eco-Aide/Fleet dropdowns inside
 * the full Create/Edit Route form.
 */
export function AssignEcoAideModal({
  route,
  routes,
  assignedEcoAide,
  setAssignedEcoAide,
  onSave,
  onClose,
  isSubmitting = false,
  errorMessage = null,
}: AssignEcoAideModalProps) {
  const routeLabel = `R${route.routeNumber}`;
  const saveLabel = isSubmitting ? "Saving..." : "Save";

  const { ecoAides, isLoading, isError } = useEcoAideOptions();
  const availableEcoAides = getAvailableEcoAides(ecoAides, routes, route.id);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  function handleSave() {
    if (isSubmitting || !assignedEcoAide) {
      return;
    }

    onSave();
  }

  return (
    <Modal title={`Assign eco-aide to ${routeLabel}`} onClose={handleClose} width={560}>
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

        <FormField label="Select Eco-Aide">
          {isError ? (
            <p className="text-sm text-red-600">
              Failed to load Eco-Aides. Please try again.
            </p>
          ) : isLoading ? (
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
              value={assignedEcoAide ?? ""}
              onChange={(event) => {
                setAssignedEcoAide(event.target.value || null);
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="">Unassigned</option>

              {availableEcoAides.map((ecoAide) => (
                <option key={ecoAide.id} value={ecoAide.id}>
                  {ecoAide.name} ({ecoAide.userNumber})
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <ModalFooter
        saveLabel={saveLabel}
        onSave={handleSave}
        onClose={handleClose}
        saveDisabled={isSubmitting || !assignedEcoAide}
      />
    </Modal>
  );
}
