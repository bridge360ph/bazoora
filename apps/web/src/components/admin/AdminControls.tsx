import type { ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";

const buttonBase =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

/** Button styles shared by every admin page and modal. */
export const BUTTON_CLASSES = {
  primary: `${buttonBase} bg-brand-dark text-white hover:bg-brand-secondary`,
  danger: `${buttonBase} bg-danger text-white hover:opacity-90`,
  ghost: `${buttonBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`,
  /** Small text-style action used inside list cards. */
  link: "inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40",
  linkDanger:
    "inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40",
} as const;

/** Input and select styles for admin filters and forms. */
export const INPUT_CLASSES =
  "h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-800 outline-none placeholder:text-gray-400 focus:border-brand-secondary";

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}): ReactNode {
  return (
    <div className="relative min-w-56 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLASSES} pl-9`}
      />
    </div>
  );
}

export function AdminRefreshButton({
  onClick,
  isRefreshing,
  label = "Refresh",
}: {
  onClick: () => void;
  isRefreshing: boolean;
  label?: string;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isRefreshing}
      aria-label={label}
      title={label}
      className="cursor-pointer rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
    </button>
  );
}

/** Fills leftover list space, or shows an empty or error message. */
export function AdminEmptySlot({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="flex min-h-20 flex-auto items-center justify-center rounded-md border border-dashed border-gray-200 px-4 text-center text-xs text-gray-400">
      {children}
    </div>
  );
}

export function AdminLoadingList({ rows = 4 }: { rows?: number }): ReactNode {
  return (
    <div className="flex flex-auto flex-col gap-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-md border border-gray-100 bg-gray-50"
        />
      ))}
    </div>
  );
}

export function AdminNotice({
  tone,
  children,
  onDismiss,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
  onDismiss?: () => void;
}): ReactNode {
  const toneClasses = {
    success: "bg-emerald-50 text-emerald-800",
    error: "bg-red-50 text-red-700",
    info: "bg-gray-50 text-gray-600",
  }[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-center justify-between gap-3 rounded-md px-4 py-2 text-xs ${toneClasses}`}
    >
      <span>{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="cursor-pointer font-semibold">
          Dismiss
        </button>
      )}
    </div>
  );
}

/** A summary number: small caps label over a large value. */
export function AdminStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}): ReactNode {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-bold leading-none text-gray-800">{value}</p>
      {hint && <p className="mt-1.5 text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
}

/** A small rounded label, for statuses and tags inside cards. */
export function AdminPill({
  children,
  className = "border border-surface-border text-surface-muted",
}: {
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <span className={`inline-flex rounded-full px-2 py-px text-[10px] font-medium ${className}`}>
      {children}
    </span>
  );
}
