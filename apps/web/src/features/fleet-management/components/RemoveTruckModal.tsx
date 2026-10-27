import { Modal, ModalFooter } from "@bazoora/ui";
import type { Truck } from "../fleet.types";

interface RemoveTruckModalProps {
  truck: Truck;
  isSaving: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function RemoveTruckModal({
  truck,
  isSaving,
  error,
  onConfirm,
  onClose,
}: RemoveTruckModalProps) {
  return (
    <Modal title="Remove Truck" onClose={onClose} width={430}>
      <p className="text-[13px] text-gray-700">
        Remove truck <span className="font-semibold">{truck.id}</span> (
        {truck.plateNumber}) from the fleet? This cannot be undone.
      </p>

      {truck.assignedRoute && (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          This truck is assigned to {truck.assignedRoute}. Assign another truck
          to that route first, or the removal will be refused.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </p>
      )}

      <ModalFooter
        saveLabel={isSaving ? "Removing..." : "Remove"}
        saveDisabled={isSaving}
        onSave={onConfirm}
        onClose={onClose}
      />
    </Modal>
  );
}
