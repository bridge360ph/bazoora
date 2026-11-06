import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement>(null);

  const isActive = selectedValues.length > 0;

  // Close when clicking anywhere outside the dropdown.
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-9 min-w-40 items-center justify-between gap-2 rounded-md border px-3 text-xs font-medium transition ${
          isActive
            ? "border-brand-dark bg-brand-dark text-white"
            : "border-surface-border bg-white text-gray-700 hover:border-brand-secondary"
        }`}
      >
        <span className="flex items-center gap-1.5">
          {label}
          {isActive && (
            <span className="rounded-full bg-white/20 px-1.5 text-[10px] font-bold">
              {selectedValues.length}
            </span>
          )}

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

        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""} ${
            isActive ? "text-white" : "text-surface-muted"
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full min-w-48 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
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
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-gray-50 ${
                  isSelected
                    ? "font-semibold text-brand-dark"
                    : "text-gray-700"
                }`}
              >
                {option.label}
                {isSelected && (
                  <Check className="h-3.5 w-3.5 text-brand-secondary" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}