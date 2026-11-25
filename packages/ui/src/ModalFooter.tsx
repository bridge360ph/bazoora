import { Button } from "./Button";

interface ModalFooterProps {
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
  saveDisabled?: boolean;
  /**
   * True while the save is in flight: the save button shows a spinner and
   * both buttons are disabled, so the modal cannot be closed mid-save.
   */
  saving?: boolean;
}

export function ModalFooter({
  saveLabel,
  onSave,
  onClose,
  saveDisabled = false,
  saving = false,
}: ModalFooterProps) {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2.5">
      <Button
        onClick={onSave}
        disabled={saveDisabled}
        loading={saving}
      >
        {saveLabel}
      </Button>

      <Button
        variant="secondary"
        onClick={onClose}
        disabled={saving}
      >
        × Close
      </Button>
    </div>
  );
}
