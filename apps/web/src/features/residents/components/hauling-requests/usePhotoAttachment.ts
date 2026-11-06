import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { MAX_PHOTO_SIZE_BYTES } from "./constants";

export function usePhotoAttachment({
  onError,
}: {
  onError: (message: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Revokes the previous preview URL whenever it changes and on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];

    if (!selected) return;

    onError(null);

    if (!selected.type.startsWith("image/")) {
      onError("Please select an image file.");
      resetInput();
      return;
    }

    if (selected.size > MAX_PHOTO_SIZE_BYTES) {
      onError("Photo must be smaller than 10MB.");
      resetInput();
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function clear() {
    setFile(null);
    setPreviewUrl(null);
    resetInput();
  }

  function openPicker() {
    inputRef.current?.click();
  }

  return { inputRef, file, previewUrl, selectFile, clear, openPicker };
}
