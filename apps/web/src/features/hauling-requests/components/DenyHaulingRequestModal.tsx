import type { HaulingRequest } from "@bazoora/shared";
import {
  Modal,
  Button
} from "@bazoora/ui";

interface DenyHaulingRequestModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onConfirm: (requestId: string) => void;
  isSubmitting: boolean;
}

/**
 * Confirmation modal for denying a hauling request. No mockup was supplied
 * for this state, so it mirrors the Approve modal's layout for consistency.
 */
export function DenyHaulingRequestModal({
  request,
  onClose,
  onConfirm,
  isSubmitting,
}: DenyHaulingRequestModalProps) {
  return (
    <Modal title="Deny Request" onClose={onClose} width={420}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to deny request{" "}
          <span className="font-semibold text-gray-900">
            {request.requestId}
          </span>
          ? This action cannot be undone.
        </p>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            className="bg-red-900 text-white"
            disabled={isSubmitting}
            onClick={() => onConfirm(request.requestId)}
          >
            {isSubmitting ? "Denying..." : "Deny"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}