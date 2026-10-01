import type { ChangeEvent, ReactNode, RefObject } from "react";
import { Camera, X } from "lucide-react";

import { FieldLabel } from "./FormUi";

export default function PhotoAttachmentField({
  inputRef,
  file,
  previewUrl,
  onSelectFile,
  onRemove,
  onOpenPicker,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  file: File | null;
  previewUrl: string | null;
  onSelectFile: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onOpenPicker: () => void;
}): ReactNode {
  return (
    <div className="mt-4">
      <FieldLabel>Photo Attachment (optional)</FieldLabel>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onSelectFile}
        className="hidden"
      />

      {!previewUrl ? (
        <button
          type="button"
          onClick={onOpenPicker}
          className="mt-1.5 flex h-24 w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white transition hover:bg-gray-50"
        >
          <Camera className="h-6 w-6 text-surface-muted" />

          <span className="mt-2 text-[10px] font-medium text-surface-muted">
            Tap to upload/capture issue photo
          </span>

          <span className="mt-1 text-[8px] tracking-wider text-gray-400">
            JPG, PNG, WEBP UP TO 10MB
          </span>
        </button>
      ) : (
        <div className="relative mt-1.5 overflow-hidden rounded-lg border border-surface-border">
          <img
            src={previewUrl}
            alt="Selected hauling request"
            className="h-32 w-full object-cover"
          />

          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove photo"
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="bg-white px-3 py-2 text-[9px] text-gray-500">
            {file?.name}
          </div>
        </div>
      )}
    </div>
  );
}
