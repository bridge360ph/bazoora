import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { FormField, Modal, ModalFooter } from "@bazoora/ui";
import type { DriverFormValue } from "../fleet.types";

interface DriverFormModalProps {
  formValue: DriverFormValue;
  setFormValue: Dispatch<SetStateAction<DriverFormValue>>;
  isSaving: boolean;
  error: string;
  onSave: () => void;
  onClose: () => void;
}

type DriverFormErrors = Partial<Record<keyof DriverFormValue, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputBaseClass =
  "box-border w-full rounded-[7px] border bg-white px-[10px] py-2 text-[13px] text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2";

// Mirrors the API's password rules in apps/api/src/lib/password.ts so the
// admin sees the problem before submitting.
function getPasswordError(password: string): string | undefined {
  if (password.length < 8 || password.length > 128) {
    return "Password must be between 8 and 128 characters.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character.";
  }

  return undefined;
}

function getFieldError(
  key: keyof DriverFormValue,
  formValue: DriverFormValue,
): string | undefined {
  if (key === "name") {
    return formValue.name.trim() ? undefined : "Full name is required.";
  }

  if (key === "email") {
    const email = formValue.email.trim();

    if (!email) {
      return "Email is required.";
    }

    return EMAIL_PATTERN.test(email) ? undefined : "Enter a valid email address.";
  }

  if (!formValue.password) {
    return "Password is required.";
  }

  return getPasswordError(formValue.password);
}

export function DriverFormModal({
  formValue,
  setFormValue,
  isSaving,
  error,
  onSave,
  onClose,
}: DriverFormModalProps) {
  const [errors, setErrors] = useState<DriverFormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  function updateField(key: keyof DriverFormValue, value: string) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: undefined,
    }));
  }

  function validateField(key: keyof DriverFormValue) {
    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: getFieldError(key, formValue),
    }));
  }

  function getInputClass(hasError: boolean) {
    return `${inputBaseClass} ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-100"
        : "border-gray-300 focus:border-brand focus:ring-brand/15"
    }`;
  }

  function handleSave() {
    const fields: (keyof DriverFormValue)[] = ["name", "email", "password"];
    const nextErrors: DriverFormErrors = {};

    for (const field of fields) {
      const error = getFieldError(field, formValue);

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
    <Modal title="Add Driver" onClose={onClose} width={460}>
      <p className="mb-4 text-xs text-gray-500">
        Give the driver this email and password to sign in. Fields marked with{" "}
        <span className="font-bold text-red-600">*</span> are required.
      </p>

      <div className="grid grid-cols-1 gap-[14px]">
        <FormField label="Full Name" required error={errors.name}>
          <input
            value={formValue.name}
            maxLength={100}
            placeholder="e.g. Juan Dela Cruz"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => {
              updateField("name", event.target.value);
            }}
            onBlur={() => {
              validateField("name");
            }}
            className={getInputClass(Boolean(errors.name))}
          />
        </FormField>

        <FormField label="Email" required error={errors.email}>
          <input
            type="email"
            value={formValue.email}
            maxLength={254}
            placeholder="e.g. driver@bazoora.com"
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => {
              updateField("email", event.target.value);
            }}
            onBlur={() => {
              validateField("email");
            }}
            className={getInputClass(Boolean(errors.email))}
          />
        </FormField>

        <FormField label="Temporary Password" required error={errors.password}>
          <div className="flex gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={formValue.password}
              maxLength={128}
              placeholder="e.g. Bazoora-Juan-5895"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              onChange={(event) => {
                updateField("password", event.target.value);
              }}
              onBlur={() => {
                validateField("password");
              }}
              className={getInputClass(Boolean(errors.password))}
            />
            <button
              type="button"
              onClick={() => {
                setShowPassword((current) => !current);
              }}
              className="shrink-0 rounded-[7px] border border-gray-300 px-3 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </FormField>

        <p className="text-[11.5px] text-gray-500">
          Use Bazoora, the driver&apos;s first name and the digits of their truck&apos;s
          plate number, separated by dashes.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
        >
          {error}
        </p>
      )}

      <ModalFooter
        saveLabel={isSaving ? "Adding..." : "Add Driver"}
        saveDisabled={isSaving}
        onSave={handleSave}
        onClose={onClose}
      />
    </Modal>
  );
}
