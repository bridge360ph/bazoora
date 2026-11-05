import { useEffect, type ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  width?: number;
  /** Small caps line above the title, for example "FLEET MANAGEMENT". */
  eyebrow?: string;
}

/**
 * Admin modal frame: small caps eyebrow, bold title and close button on top,
 * scrolling content, and a footer bar when ModalFooter is used. Escape and
 * the backdrop close it.
 */
export function Modal({ title, children, onClose, width = 560, eyebrow }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="report-slide-in flex max-h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        style={{ maxWidth: width }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-6 pb-4 pt-6">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-semibold tracking-wider text-gray-400">{eyebrow}</p>
            )}
            <h2 className="mt-1 truncate text-lg font-bold text-gray-800">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-5">
          {children}
          {/* Bottom spacing for modals without a footer. */}
          <div className="h-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
