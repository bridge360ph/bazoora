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
        className="flex h-full min-w-[170px] items-center justify-between gap-2 rounded-lg bg-[#062f22] px-4 py-2.5 text-sm font-medium text-white"
      >
        {displayLabel}
        <svg className="h-3 w-3" viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 0l5 6 5-6H0z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full min-w-[170px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
