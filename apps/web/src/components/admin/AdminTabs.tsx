import type { ReactNode } from "react";

export interface AdminTab<T extends string> {
  value: T;
  label: string;
  count?: number;
  /** Shows the count in orange when it is above zero (items needing action). */
  highlight?: boolean;
}

/**
 * Centred tabs with counts along the top of a panel, as on Hauling Request
 * Management. Actions (refresh, create) sit at the right edge.
 */
export function AdminTabs<T extends string>({
  tabs,
  active,
  onChange,
  actions,
}: {
  tabs: AdminTab<T>[];
  active: T;
  onChange: (value: T) => void;
  actions?: ReactNode;
}): ReactNode {
  return (
    <div className="flex shrink-0 items-end gap-3 border-b border-gray-100 pt-5">
      {/* Keeps the tabs centred when there are actions on the right. */}
      {actions && tabs.length <= 4 && (
        <div className="hidden w-48 shrink-0 xl:block" aria-hidden="true" />
      )}

      <div
        className={`flex min-w-0 flex-1 gap-1 overflow-x-auto px-3 ${
          tabs.length > 4 ? "sm:gap-2 xl:justify-center" : "sm:justify-center sm:gap-10"
        }`}
      >
        {tabs.map((tab) => (
          <AdminTabButton
            key={tab.value}
            isActive={active === tab.value}
            {...(tab.count !== undefined && { count: tab.count })}
            highlight={tab.highlight ?? false}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </AdminTabButton>
        ))}
      </div>

      {actions && (
        <div className="mb-2.5 mr-5 flex shrink-0 items-center justify-end gap-2 xl:min-w-48">
          {actions}
        </div>
      )}
    </div>
  );
}

export function AdminTabButton({
  isActive,
  count,
  highlight = false,
  onClick,
  children,
}: {
  isActive: boolean;
  count?: number;
  highlight?: boolean;
  onClick: () => void;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap px-3 pb-3 text-xs font-bold sm:px-5 ${
        isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
            highlight && count > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}

      {isActive && <span className="absolute bottom-0 left-0 right-0 h-px bg-brand-dark" />}
    </button>
  );
}
