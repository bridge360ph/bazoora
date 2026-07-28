import { useState } from "react";

interface FilterOption<T extends string> {
  label: string;
  value: T;
}

interface MultiSelectFilterDropdownProps<
  TValue extends string,
  TOption extends TValue | string,
> {
  label: string;
  options: FilterOption<TOption>[];
  allValue: TOption;
  selectedValues: TValue[];
  onToggleValue: (value: TValue) => void;
  onClear: () => void;
}

/**
 * Multi-select dropdown filter button, specific to Hauling Request
 * Management. Kept feature-local rather than added to the shared
 * FilterByDropdown, which is single-select and used by other features
 * (Fleet Management) that shouldn't be affected by this behavior.
 *
 * - No values selected: ghost/outlined button, shows just `label`.
 * - One or more selected: filled dark button, `label` plus a small "×"
 *   that clears just this dropdown's selection.
 * - Clicking "All" clears the selection and closes the menu.
 * - Clicking any other option toggles it without closing the menu.
 */
export function MultiSelectFilterDropdown<
  TValue extends string,
  TOption extends TValue | string,
>({
  label,
  options,
  allValue,
  selectedValues,
  onToggleValue,
  onClear,
}: MultiSelectFilterDropdownProps<TValue, TOption>) {
  const [isOpen, setIsOpen] = useState(false);

  const isActive = selectedValues.length > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-full min-w-[170px] items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
          isActive
            ? "bg-brand-dark text-white"
            : "border border-gray-300 bg-white text-gray-700"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {label}

          {isActive && (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onClear();
                }
              }}
              aria-label={`Clear ${label.toLowerCase()}`}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full leading-none hover:bg-white/20"
            >
              ×
            </span>
          )}
        </span>

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
          {options.map((option) => {
            const isAllOption = option.value === allValue;

            const isSelected =
              !isAllOption &&
              selectedValues.includes(option.value as TValue);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (isAllOption) {
                    onClear();
                    setIsOpen(false);
                    return;
                  }

                  onToggleValue(option.value as TValue);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  isSelected
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700"
                }`}
              >
                {option.label}
                {isSelected && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}