import { Modal, ModalFooter } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";

interface DeleteRouteModalProps {
  route: Route;
  onConfirm: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function DeleteRouteModal({
  route,
  onConfirm,
  onClose,
  isSubmitting = false,
  errorMessage = null,
}: DeleteRouteModalProps) {
  const isInProgress = route.status === "In Progress";

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  return (
    <Modal title="Delete Route" onClose={handleClose} width={460}>
      {errorMessage && (
        <p className="mb-3 text-sm text-red-600">{errorMessage}</p>
      )}

      <p className="text-sm text-gray-700">
        Delete route <span className="font-semibold">{route.routeDisplayNumber}</span>{" "}
        ({route.name})? This cannot be undone.
      </p>

      {(route.assignedEcoAideId || route.assignedTruckId) && (
        <p className="mt-3 text-xs text-gray-500">
          Its eco-aide and truck will be unassigned and can be used on another
          route.
        </p>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Approved hauling requests on this route will go back to &quot;No route
        yet&quot; and can be assigned to another route.
      </p>

      {isInProgress && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          This route is in progress. It can be deleted once it is completed.
        </p>
      )}

      <ModalFooter
        saveLabel={isSubmitting ? "Deleting..." : "Delete"}
        onSave={onConfirm}
        onClose={handleClose}
        saveDisabled={isSubmitting || isInProgress}
      />
    </Modal>
  );
}
