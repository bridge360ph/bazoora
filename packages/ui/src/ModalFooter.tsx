import { Button } from "./Button";

interface ModalFooterProps {
  saveLabel: string;
  onSave: () => void;
  onClose: () => void;
  saveDisabled?: boolean;
}

export function ModalFooter({
  saveLabel,
  onSave,
  onClose,
  saveDisabled = false,
}: ModalFooterProps) {
  return (
    <div className="mt-5 flex flex-wrap justify-center gap-2.5">
      <Button
        onClick={onSave}
        disabled={saveDisabled}
      >
        {saveLabel}
      </Button>

      <Button
        variant="secondary"
        onClick={onClose}
      >
        × Close
      </Button>
    </div>
  );
}
