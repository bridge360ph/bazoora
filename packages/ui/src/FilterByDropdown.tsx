import { useState } from "react";

interface FilterByDropdownProps<T extends string> {
  label: string;
  value: T;
  options: T[];
  allValue: T;
  onChange: (value: T) => void;
}

/**
 * Generic dark pill dropdown button (e.g. "Filter by Status", "Filter by
 * Sender"). Shows `label` when the current value is `allValue`, otherwise
 * shows the selected option itself. Reusable for any string-literal filter
 * type across features.
 */
export function FilterByDropdown<T extends string>({
  label,
  value,
  options,
  allValue,
  onChange,
}: FilterByDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const displayLabel = value === allValue ? label : value;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-9 min-w-40 cursor-pointer items-center justify-between gap-2 rounded-md border px-3 text-xs font-medium transition ${
          value === allValue
            ? "border-surface-border bg-white text-gray-700 hover:border-brand-secondary"
            : "border-brand-dark bg-brand-dark text-white"
        }`}
      >
        {displayLabel}
        <svg className="h-3 w-3" viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 0l5 6 5-6H0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full min-w-48 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`block w-full cursor-pointer px-3 py-2 text-left text-xs hover:bg-gray-50 ${
                option === value ? "font-semibold text-brand-dark" : "text-gray-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
