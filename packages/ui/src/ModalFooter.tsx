interface ModalFooterProps {
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
  saveDisabled?: boolean;
  closeLabel?: string;
  /** Red save button, for removing or deleting. */
  danger?: boolean;
}

const buttonBase =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Footer bar of a Modal: Cancel on the left of the main action, both on the
 * right. It sticks to the bottom while the content scrolls.
 */
export function ModalFooter({
  saveLabel,
  onSave,
  onClose,
  saveDisabled = false,
  closeLabel = "Cancel",
  danger = false,
}: ModalFooterProps) {
  return (
    <div className="sticky bottom-0 -mx-6 -mb-5 mt-5 flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
      <button
        type="button"
        onClick={onClose}
        className={`${buttonBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}
      >
        {closeLabel}
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saveDisabled}
        className={`${buttonBase} ${
          danger ? "bg-danger text-white hover:opacity-90" : "bg-brand-dark text-white hover:bg-brand-secondary"
        }`}
      >
        {saveLabel}
      </button>
    </div>
  );
}
