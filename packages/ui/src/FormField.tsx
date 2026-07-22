import type { ReactNode } from "react";

export interface FormFieldProps {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
}

export function FormField({
  label,
  children,
  required = false,
  error,
}: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
      <span>
        {label}

        {required && (
          <span
            aria-hidden="true"
            className="ml-1 text-red-600"
          >
            *
          </span>
        )}
      </span>

      {children}

      {error && (
        <span
          role="alert"
          className="text-xs font-normal text-red-600"
        >
          {error}
        </span>
      )}
    </label>
  );
}
