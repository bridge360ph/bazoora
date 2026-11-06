import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Modal frame for the admin hauling request windows. Matches the resident
 * RequestDetailsModal: small caps eyebrow, bold title, close button, white
 * rounded panel on a dimmed backdrop.
 */
export function AdminModalShell({
  eyebrow,
  title,
  onClose,
  children,
  footer,
  maxWidthClassName = "max-w-md",
  dismissible = true,
}: {
  eyebrow: string;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  /**
   * False while a request is in flight. Escape, the backdrop and the close
   * button are ignored then, so closing cannot hide the outcome (or the
   * error) of a write that is still landing.
   */
  dismissible?: boolean;
}): ReactNode {
  const requestClose = () => {
    if (dismissible) onClose();
  };

  useEffect(() => {
    if (!dismissible) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, dismissible]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      onClick={requestClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`report-slide-in flex max-h-full w-full ${maxWidthClassName} flex-col overflow-hidden rounded-xl bg-white shadow-xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 pb-4 pt-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-wider text-gray-400">
              {eyebrow}
            </p>
            <h2 className="mt-1 truncate text-lg font-bold text-gray-800">
              {title}
            </h2>
          </div>

          <button
            type="button"
            onClick={requestClose}
            disabled={!dismissible}
            aria-label="Close"
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Small-caps label above a value, as in the resident request details. */
export function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold tracking-wider text-gray-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-gray-800">{children}</div>
    </div>
  );
}

const buttonBase =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

export const BUTTON_CLASSES = {
  primary: `${buttonBase} bg-brand-dark text-white hover:bg-brand-secondary`,
  danger: `${buttonBase} bg-danger text-white hover:opacity-90`,
  ghost: `${buttonBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`,
} as const;
