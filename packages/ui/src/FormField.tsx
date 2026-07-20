import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
}

/**
 * Generic label-above-input wrapper used across form modals.
 */
export function FormField({
  label,
  children,
  required = false,
  error,
}: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-gray-700">
        {label}
        {required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </span>

      {children}

      {error && (
        <span className="text-xs font-medium text-red-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
