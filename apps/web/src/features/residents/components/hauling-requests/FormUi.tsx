import type { ReactNode } from "react";

import { getStatusClasses } from "./utils";

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[10px] font-medium text-gray-700"
    >
      {children}
    </label>
  );
}

export function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}): ReactNode {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[7px] font-bold ${getStatusClasses(status)} ${className}`}
    >
      {status}
    </span>
  );
}
