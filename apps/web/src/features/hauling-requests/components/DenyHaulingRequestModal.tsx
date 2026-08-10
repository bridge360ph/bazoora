import { useState } from "react";
import type { HaulingRequest } from "@bazoora/shared";
import {
  Modal,
  Button
} from "@bazoora/ui";

const DENIAL_REASON_MIN_LENGTH = 5;
const DENIAL_REASON_MAX_LENGTH = 500;

interface DenyHaulingRequestModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onConfirm: (requestId: string, denialReason: string) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

/**
 * Confirmation modal for denying a hauling request. No mockup was supplied
 * for this state, so it mirrors the Approve modal's layout for consistency.
 *
 * The API requires a denial reason, so it is collected here and validated
 * against the same bounds the backend enforces.
 */
export function DenyHaulingRequestModal({
  request,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}: DenyHaulingRequestModalProps) {
  const [denialReason, setDenialReason] = useState("");

  const trimmedReason = denialReason.trim();
  const reasonIsValid =
    trimmedReason.length >= DENIAL_REASON_MIN_LENGTH &&
    trimmedReason.length <= DENIAL_REASON_MAX_LENGTH;

  return (
    <Modal title="Deny Request" onClose={onClose} width={420}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to deny request{" "}
          <span className="font-semibold text-gray-900">
            {request.requestId}
          </span>
          ? This action cannot be undone.
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-700">
            Reason for denial
          </span>
          <textarea
            value={denialReason}
            onChange={(event) => setDenialReason(event.target.value)}
            maxLength={DENIAL_REASON_MAX_LENGTH}
            rows={3}
            disabled={isSubmitting}
            placeholder="Let the requester know why this was denied"
            className="rounded-md border border-gray-300 p-2 text-sm focus:border-brand focus:outline-none disabled:opacity-50"
          />
          <span className="text-xs text-gray-500">
            {trimmedReason.length}/{DENIAL_REASON_MAX_LENGTH}, at least{" "}
            {DENIAL_REASON_MIN_LENGTH} characters
          </span>
        </label>

        {errorMessage !== undefined && errorMessage !== "" && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            className="bg-red-900 text-white"
            disabled={isSubmitting || !reasonIsValid}
            onClick={() => onConfirm(request.requestId, trimmedReason)}
          >
            {isSubmitting ? "Denying..." : "Deny"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
