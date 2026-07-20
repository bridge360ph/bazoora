import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { FormField, Modal, ModalFooter } from "@bazoora/ui";
import type { TruckFormValue, TruckStatus } from "../fleet.types";

interface TruckFormModalProps {
  title: string;
  formValue: TruckFormValue;
  setFormValue: Dispatch<SetStateAction<TruckFormValue>>;
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
}

type TruckFormErrors = Partial<
  Record<"plateNumber" | "model" | "capacity" | "status", string>
>;

const inputBaseClass =
  "box-border w-full rounded-[7px] border bg-white px-[10px] py-2 text-[13px] text-gray-900 outline-none transition focus:ring-2";

export function TruckFormModal({
  title,
  formValue,
  setFormValue,
  saveLabel,
  onSave,
  onClose,
}: TruckFormModalProps) {
  const [errors, setErrors] = useState<TruckFormErrors>({});

  function clearError(key: keyof TruckFormErrors) {
    setErrors((currentErrors) => {
      if (!currentErrors[key]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  function updateField<Key extends keyof TruckFormValue>(
    key: Key,
    value: TruckFormValue[Key],
  ) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));

    if (
      key === "plateNumber" ||
      key === "model" ||
      key === "capacity" ||
      key === "status"
    ) {
      clearError(key);
    }
  }

  function getInputClass(hasError: boolean) {
    return `${inputBaseClass} ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : "border-gray-300 focus:border-brand focus:ring-brand/15"
    }`;
  }

  function handleSave() {
    const nextErrors: TruckFormErrors = {};
    const normalizedCapacity = Number(formValue.capacity.trim());

    if (!formValue.plateNumber.trim()) {
      nextErrors.plateNumber = "Plate number is required.";
    }

    if (!formValue.model.trim()) {
      nextErrors.model = "Truck model is required.";
    }

    if (!formValue.capacity.trim()) {
      nextErrors.capacity = "Capacity is required.";
    } else if (!Number.isFinite(normalizedCapacity) || normalizedCapacity <= 0) {
      nextErrors.capacity = "Capacity must be greater than 0.";
    }

    if (!formValue.status) {
      nextErrors.status = "Status is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave();
  }

  return (
    <Modal title={title} onClose={onClose} width={560}>
      <p className="mb-4 text-xs text-gray-500">
        Fields marked with <span className="font-bold text-red-600">*</span> are
        required.
      </p>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <FormField label="Assigned Driver">
          <input
            value={formValue.assignedDriver}
            onChange={(event) => {
              updateField("assignedDriver", event.target.value);
            }}
            placeholder="e.g. Henry Correa"
            className={getInputClass(false)}
          />
        </FormField>

        <FormField
          label="Plate Number"
          required
          error={errors.plateNumber}
        >
          <input
            value={formValue.plateNumber}
            onChange={(event) => {
              updateField("plateNumber", event.target.value);
            }}
            placeholder="e.g. GTM-5895"
            aria-invalid={Boolean(errors.plateNumber)}
            className={getInputClass(Boolean(errors.plateNumber))}
          />
        </FormField>

        <FormField label="Truck Model" required error={errors.model}>
          <input
            value={formValue.model}
            onChange={(event) => {
              updateField("model", event.target.value);
            }}
            placeholder="e.g. Isuzu Elf"
            aria-invalid={Boolean(errors.model)}
            className={getInputClass(Boolean(errors.model))}
          />
        </FormField>

        <FormField label="Capacity (kg)" required error={errors.capacity}>
          <input
            value={formValue.capacity}
            onChange={(event) => {
              updateField("capacity", event.target.value);
            }}
            placeholder="e.g. 7000"
            type="number"
            min="1"
            aria-invalid={Boolean(errors.capacity)}
            className={getInputClass(Boolean(errors.capacity))}
          />
        </FormField>

        <FormField label="Status" required error={errors.status}>
          <select
            value={formValue.status}
            onChange={(event) => {
              updateField("status", event.target.value as TruckStatus);
            }}
            aria-invalid={Boolean(errors.status)}
            className={getInputClass(Boolean(errors.status))}
          >
            <option value="Active">Active</option>
            <option value="Idle">Idle</option>
            <option value="Under Maintenance">Under Maintenance</option>
          </select>
        </FormField>
      </div>

      <ModalFooter
        saveLabel={saveLabel}
        onSave={handleSave}
        onClose={onClose}
      />
    </Modal>
  );
}
