import { useState } from "react";

interface FilterByDropdownProps<T extends string> {
  label: string;
  value: T;
  options: T[];
  allValue: T;
  onChange: (value: T) => void;

  /**
   * Controls the appearance when the filter is in its default All state.
   * Default keeps existing dark pill styling for backwards compatibility.
   */
  inactiveStyle?: "default" | "ghost";
}

export function FilterByDropdown<T extends string>({
  label,
  value,
  options,
  allValue,
  onChange,
  inactiveStyle = "default",
}: FilterByDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const displayLabel = value === allValue ? label : value;
  const isDefaultState = value === allValue;

  const buttonStyle =
    inactiveStyle === "ghost" && isDefaultState
      ? "border border-gray-300 bg-white text-gray-700"
      : "bg-[#062f22] text-white";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`
          flex h-full min-w-[170px]
          items-center justify-between gap-2
          rounded-lg px-4 py-2.5
          text-sm font-medium
          ${buttonStyle}
        `}
      >
        {displayLabel}

        <svg
          className="h-3 w-3"
          viewBox="0 0 10 6"
          fill="currentColor"
        >
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