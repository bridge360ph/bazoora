import { Button } from "./Button";

interface ModalFooterProps {
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
}

/**
 * Generic Save/Close button row used at the bottom of form and confirmation
 * modals.
 */
export function ModalFooter({
  saveLabel,
  onSave,
  onClose,
}: ModalFooterProps) {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2.5">
      <Button onClick={onSave}>{saveLabel}</Button>
      <Button variant="secondary" onClick={onClose}>
        × Close
      </Button>
    </div>
  );
}
