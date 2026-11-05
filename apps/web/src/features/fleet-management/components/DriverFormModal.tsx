import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { FormField, Modal, ModalFooter } from "@bazoora/ui";
import type { DriverFormValue } from "../fleet.types";
import { BRANCHES, type Branch } from "@/lib/branches";

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
  "h-9 w-full rounded-md border bg-white px-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2";

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

/** "Quezon City Branch" (city "Quezon City") becomes "QuezonCity". */
function branchWord(branch: Branch): string {
  return (branch.city.split(",")[0] ?? branch.city).replace(/[^A-Za-z0-9]/g, "");
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * The temporary password template: Bazoora-FNLastname-BranchYear, for
 * example "Juan Dela Cruz" at the Makati branch in 2026 becomes
 * "Bazoora-JDelaCruz-Makati2026". Missing parts use sample values.
 */
function suggestPassword(name: string, branch: Branch | undefined): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initial = words[0]?.[0]?.toUpperCase() ?? "J";
  const lastName =
    words.length > 1 ? words.slice(1).map((word) => capitalize(word.replace(/[^A-Za-z]/g, ""))).join("") : "DelaCruz";
  const place = branch ? branchWord(branch) : "Makati";

  return `Bazoora-${initial}${lastName}-${place}${new Date().getFullYear()}`;
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
  // Only used to build the suggested password; it is not saved.
  const [branchId, setBranchId] = useState("");
  const branch = BRANCHES.find((item) => item.id === branchId);
  const suggestedPassword = suggestPassword(formValue.name, branch);

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
        : "border-surface-border focus:border-brand-secondary focus:ring-brand/10"
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

        <FormField label="Branch">
          <select
            value={branchId}
            onChange={(event) => {
              setBranchId(event.target.value);
            }}
            className={`${getInputClass(false)} cursor-pointer`}
          >
            <option value="">Select the driver&apos;s branch</option>
            {BRANCHES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.city})
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Temporary Password" required error={errors.password}>
          <div className="flex gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={formValue.password}
              maxLength={128}
              placeholder={`e.g. ${suggestedPassword}`}
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
              className="h-9 shrink-0 cursor-pointer rounded-md border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </FormField>

        <p className="text-[11px] text-gray-500">
          Format: Bazoora, the first initial and last name, then the branch and year, separated
          by dashes. For this driver: <span className="font-semibold text-gray-700">{suggestedPassword}</span>
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
