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

type ValidatedTruckField =
  | "assignedDriver"
  | "plateNumber"
  | "model"
  | "capacity"
  | "status";

type TruckFormErrors = Partial<
  Record<ValidatedTruckField, string>
>;

const DRIVER_NAME_PATTERN = /^[\p{L} .'-]+$/u;
const PLATE_NUMBER_PATTERN =
  /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;
const TRUCK_MODEL_PATTERN =
  /^[\p{L}\p{N} ./'-]+$/u;

const ALLOWED_TRUCK_STATUSES: TruckStatus[] = [
  "Active",
  "Idle",
  "Under Maintenance",
];

const inputBaseClass =
  "box-border w-full rounded-[7px] border bg-white px-[10px] py-2 text-[13px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2";

export function TruckFormModal({
  title,
  formValue,
  setFormValue,
  saveLabel,
  onSave,
  onClose,
}: TruckFormModalProps) {
  const [errors, setErrors] =
    useState<TruckFormErrors>({});

  function clearError(key: ValidatedTruckField) {
    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: undefined,
    }));
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
      key === "assignedDriver" ||
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

  function getFieldError(
    key: ValidatedTruckField,
  ): string | undefined {
    const value = String(formValue[key] ?? "").trim();

    if (key === "assignedDriver") {
      if (!value) {
        return "Assigned driver is required.";
      }

      if (value.length < 2) {
        return "Driver name must contain at least 2 characters.";
      }

      if (value.length > 100) {
        return "Driver name must not exceed 100 characters.";
      }

      if (!DRIVER_NAME_PATTERN.test(value)) {
        return "Use letters, spaces, periods, hyphens, or apostrophes only.";
      }
    }

    if (key === "plateNumber") {
      if (!value) {
        return "Plate number is required.";
      }

      if (value.length < 3) {
        return "Plate number must contain at least 3 characters.";
      }

      if (value.length > 15) {
        return "Plate number must not exceed 15 characters.";
      }

      if (!PLATE_NUMBER_PATTERN.test(value)) {
        return "Use uppercase letters, numbers, and hyphens only.";
      }
    }

    if (key === "model") {
      if (!value) {
        return "Truck model is required.";
      }

      if (value.length < 2) {
        return "Truck model must contain at least 2 characters.";
      }

      if (value.length > 100) {
        return "Truck model must not exceed 100 characters.";
      }

      if (!TRUCK_MODEL_PATTERN.test(value)) {
        return "Truck model contains unsupported characters.";
      }
    }

    if (key === "capacity") {
      if (!value) {
        return "Capacity is required.";
      }

      if (!/^\d+$/.test(value)) {
        return "Capacity must contain digits only.";
      }

      const capacity = Number(value);

      if (!Number.isSafeInteger(capacity) || capacity <= 0) {
        return "Capacity must be greater than 0.";
      }

      if (capacity > 999999) {
        return "Capacity must not exceed 999,999 kg.";
      }
    }

    if (
      key === "status" &&
      !ALLOWED_TRUCK_STATUSES.includes(
        formValue.status,
      )
    ) {
      return "Select a valid truck status.";
    }

    return undefined;
  }

  function validateField(key: ValidatedTruckField) {
    const error = getFieldError(key);

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: error,
    }));
  }

  function handleSave() {
    const fields: ValidatedTruckField[] = [
      "assignedDriver",
      "plateNumber",
      "model",
      "capacity",
      "status",
    ];

    const nextErrors: TruckFormErrors = {};

    for (const field of fields) {
      const error = getFieldError(field);

      if (error) {
        nextErrors[field] = error;
      }
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
        Fields marked with{" "}
        <span className="font-bold text-red-600">*</span>{" "}
        are required.
      </p>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
        <FormField
          label="Assigned Driver"
          required
          error={errors.assignedDriver}
        >
          <input
            value={formValue.assignedDriver}
            maxLength={100}
            placeholder="e.g. Henry Correa"
            autoComplete="name"
            aria-invalid={Boolean(errors.assignedDriver)}
            onChange={(event) => {
              updateField(
                "assignedDriver",
                event.target.value,
              );
            }}
            onBlur={() => {
              validateField("assignedDriver");
            }}
            className={getInputClass(
              Boolean(errors.assignedDriver),
            )}
          />
        </FormField>

        <FormField
          label="Plate Number"
          required
          error={errors.plateNumber}
        >
          <input
            value={formValue.plateNumber}
            maxLength={15}
            placeholder="e.g. GTM-5895"
            autoCapitalize="characters"
            aria-invalid={Boolean(errors.plateNumber)}
            onChange={(event) => {
              const normalizedPlate = event.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9-]/g, "")
                .slice(0, 15);

              updateField(
                "plateNumber",
                normalizedPlate,
              );
            }}
            onBlur={() => {
              validateField("plateNumber");
            }}
            className={getInputClass(
              Boolean(errors.plateNumber),
            )}
          />
        </FormField>

        <FormField
          label="Truck Model"
          required
          error={errors.model}
        >
          <input
            value={formValue.model}
            maxLength={100}
            placeholder="e.g. Isuzu Elf"
            aria-invalid={Boolean(errors.model)}
            onChange={(event) => {
              updateField("model", event.target.value);
            }}
            onBlur={() => {
              validateField("model");
            }}
            className={getInputClass(
              Boolean(errors.model),
            )}
          />
        </FormField>

        <FormField
          label="Capacity (kg)"
          required
          error={errors.capacity}
        >
          <input
            type="text"
            inputMode="numeric"
            value={formValue.capacity}
            maxLength={6}
            placeholder="e.g. 7000"
            aria-invalid={Boolean(errors.capacity)}
            onChange={(event) => {
              const digitsOnly = event.target.value
                .replace(/\D/g, "")
                .slice(0, 6);

              updateField("capacity", digitsOnly);
            }}
            onBlur={() => {
              validateField("capacity");
            }}
            className={getInputClass(
              Boolean(errors.capacity),
            )}
          />
        </FormField>

        <FormField
          label="Status"
          required
          error={errors.status}
        >
          <select
            value={formValue.status}
            aria-invalid={Boolean(errors.status)}
            onChange={(event) => {
              updateField(
                "status",
                event.target.value as TruckStatus,
              );
            }}
            onBlur={() => {
              validateField("status");
            }}
            className={getInputClass(
              Boolean(errors.status),
            )}
          >
            {ALLOWED_TRUCK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
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
