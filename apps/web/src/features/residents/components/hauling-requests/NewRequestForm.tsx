import { useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import {
  createResidentHaulingRequest,
  uploadImage,
} from "@/features/hauling-requests/api";

import { MAX_NOTE_LENGTH, WASTE_TYPES, WASTE_TYPE_LABELS } from "./constants";
import type { WasteType } from "./types";
import { FieldLabel } from "./FormUi";
import { fileToBase64, getMinimumDateTime } from "./utils";
import PhotoAttachmentField from "./PhotoAttachmentField";
import PickupAddressList from "./PickupAddressList";
import PickupMap from "./PickupMap";
import { usePhotoAttachment } from "./usePhotoAttachment";
import { usePickupAddresses } from "./usePickupAddresses";
import {
  combineAddresses,
  getFilledAddresses,
  validateRequest,
} from "./validateRequest";

const inputClassName =
  "h-9 w-full rounded-md border border-surface-border bg-white px-3 text-xs text-gray-700 outline-none focus:border-brand-secondary";

export default function NewRequestForm({
  onSubmitted,
}: {
  onSubmitted: () => void;
}): ReactNode {
  const [wasteType, setWasteType] = useState<WasteType | "">("");
  const [pickupDate, setPickupDate] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pickups = usePickupAddresses({ onError: setError });
  const photo = usePhotoAttachment({ onError: setError });

  function resetForm() {
    setWasteType("");
    setPickupDate("");
    setNote("");
    pickups.reset();
    photo.clear();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(false);

    const validationError = validateRequest({
      wasteType,
      addresses: pickups.addresses,
      pickupDate,
    });

    if (validationError || !wasteType) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const imageUrl = photo.file
        ? await uploadImage(await fileToBase64(photo.file), photo.file.type)
        : undefined;

      const trimmedNote = note.trim();

      await createResidentHaulingRequest({
        requestAddress: combineAddresses(getFilledAddresses(pickups.addresses)),
        senderType: "RESIDENT",
        wasteType,
        pickupDate: new Date(pickupDate).toISOString(),
        ...(imageUrl && { imageUrl }),
        ...(trimmedNote && { note: trimmedNote }),
      });

      setSuccess(true);
      resetForm();
      onSubmitted();
    } catch (submitError) {
      console.error("Failed to submit hauling request:", submitError);
      setError("Failed to submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full px-6 pb-6 pt-5">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left column: request details */}
        <div className="min-w-0">
          <div>
            <FieldLabel>Request ID</FieldLabel>
            <div className="mt-1.5 flex h-9 items-center rounded-md border border-surface-border bg-[#f8fbf9] px-3 text-xs text-surface-muted">
              Generated automatically after submission
            </div>
          </div>

          <PhotoAttachmentField
            inputRef={photo.inputRef}
            file={photo.file}
            previewUrl={photo.previewUrl}
            onSelectFile={photo.selectFile}
            onRemove={photo.clear}
            onOpenPicker={photo.openPicker}
          />

          <div className="mt-4">
            <FieldLabel htmlFor="waste-type">Waste Type</FieldLabel>
            <div className="relative mt-1.5">
              <select
                id="waste-type"
                value={wasteType}
                onChange={(event) =>
                  setWasteType(event.target.value as WasteType | "")
                }
                className={`${inputClassName} appearance-none pr-9`}
              >
                <option value="">Select type...</option>
                {WASTE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {WASTE_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-muted" />
            </div>
          </div>

          <div className="mt-4">
            <FieldLabel htmlFor="pickup-date">Preferred Pickup Date</FieldLabel>
            <input
              id="pickup-date"
              type="datetime-local"
              value={pickupDate}
              onChange={(event) => setPickupDate(event.target.value)}
              min={getMinimumDateTime()}
              className={`mt-1.5 ${inputClassName}`}
            />
          </div>

          <div className="mt-4">
            <FieldLabel htmlFor="request-details">Request Details</FieldLabel>
            <textarea
              id="request-details"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={MAX_NOTE_LENGTH}
              placeholder="Describe your request..."
              className="mt-1.5 h-25 w-full resize-none rounded-md border border-surface-border bg-white px-3 py-2 text-xs text-gray-700 outline-none placeholder:text-[#6d8b7b] focus:border-brand-secondary"
            />
            <p className="mt-1 text-right text-[8px] text-gray-400">
              {note.length}/{MAX_NOTE_LENGTH}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-md bg-red-50 px-3 py-2 text-[10px] text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-4 rounded-md bg-green-50 px-3 py-2 text-[10px] text-green-700"
            >
              Request submitted successfully.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#222] text-[10px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "SUBMITTING..." : "SUBMIT REQUEST"}
            {!isSubmitting && <span>→</span>}
          </button>
        </div>

        {/* Right column: pickup locations */}
        <div className="min-w-0">
          <PickupAddressList
            addresses={pickups.addresses}
            activeIndex={pickups.activeIndex}
            isResolving={pickups.isResolving}
            onSelect={pickups.setActiveIndex}
            onChange={pickups.changeAddress}
            onResolve={(index) => void pickups.resolveAddress(index)}
            onAdd={pickups.addAddress}
            onRemove={pickups.removeAddress}
          />

          <PickupMap
            addresses={pickups.addresses}
            activeIndex={pickups.activeIndex}
            isResolving={pickups.isResolving}
            onMapClick={(position) => void pickups.selectMapPosition(position)}
          />
        </div>
      </div>
    </form>
  );
}
