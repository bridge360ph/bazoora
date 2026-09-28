import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, ChevronDown, LoaderCircle, Search } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (option: SearchableSelectOption) => void;
  placeholder?: string;
  emptyMessage?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  emptyMessage = "No matching options found.",
  error,
  required = false,
  disabled = false,
  loading = false,
}: SearchableSelectProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const errorId = `${inputId}-error`;
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // DISMISS DROPDOWN WHEN CLICKING OUTSIDE
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery(selectedOption?.label ?? "");
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [selectedOption?.label]);

  // NORMALIZE AND FILTER OPTIONS BASED ON CURRENT SEARCH QUERY
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    if (
      !normalizedQuery ||
      normalizedQuery === selectedOption?.label.toLocaleLowerCase()
    ) {
      return options;
    }

    return options.filter((option) => {
      const searchableText =
        `${option.label} ${option.description ?? ""}`.toLocaleLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [options, query, selectedOption?.label]);

  function selectOption(option: SearchableSelectOption) {
    onChange(option);
    setQuery("");
    setIsOpen(false);
  }

  // ACCESSIBLE KEYBOARD NAVIGATION HANDLER
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (disabled || loading) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) =>
        Math.min(currentIndex + 1, filteredOptions.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();

      const option = filteredOptions[activeIndex];

      if (option) {
        selectOption(option);
      }

      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(selectedOption?.label ?? "");
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-xs font-bold text-gray-700 dark:text-gray-200"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          id={inputId}
          type="text"
          role="combobox"
          value={isOpen ? query : (selectedOption?.label ?? "")}
          disabled={disabled}
          placeholder={loading ? "Loading options..." : placeholder}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onFocus={() => {
            if (!disabled && !loading) {
              setActiveIndex(0);
              setQuery("");
              setIsOpen(true);
            }
          }}
          onClick={() => {
            if (!disabled && !loading && !isOpen) {
              setActiveIndex(0);
              setQuery("");
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            setActiveIndex(0);
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            window.setTimeout(() => {
              setIsOpen(false);
              setQuery("");
            }, 100);
          }}
          className={`w-full rounded-xl border bg-white py-3 pl-9 pr-10 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:disabled:bg-gray-900 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/15"
              : "border-gray-200 focus:border-brand focus:ring-brand/15 dark:border-gray-800"
          }`}
        />

        {loading ? (
          <LoaderCircle
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
          />
        ) : (
          <ChevronDown
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}
      </div>

      {isOpen && !disabled && !loading && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectOption(option);
                  }}
                  onMouseEnter={() => {
                    setActiveIndex(index);
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-xs font-semibold ${
                    isActive
                      ? "bg-brand/10 text-brand dark:bg-brand/20 dark:text-green-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-bold">
                      {option.label}
                    </span>

                    {option.description && (
                      <span className="block truncate text-[11px] text-gray-400">
                        {option.description}
                      </span>
                    )}
                  </span>

                  {isSelected && (
                    <Check
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-emerald-600"
                    />
                  )}
                </li>
              );
            })
          ) : (
            <li className="px-3 py-3 text-center text-xs text-gray-400">
              {emptyMessage}
            </li>
          )}
        </ul>
      )}

      {error && (
        <span
          id={errorId}
          role="alert"
          className="mt-1 block text-xs font-normal text-red-500"
        >
          {error}
        </span>
      )}
    </div>
  );
}