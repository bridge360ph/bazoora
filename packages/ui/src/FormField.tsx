import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
}

/**
 * Generic label-above-input wrapper used across form modals.
 */
export function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  );
}
