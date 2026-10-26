import { useState, type ReactNode } from "react";
import type { HaulingRequest } from "@bazoora/shared";
import { X } from "lucide-react";

import { AdminModalShell, BUTTON_CLASSES } from "./AdminModalShell";

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
 * Confirmation window for denying a hauling request.
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
}: DenyHaulingRequestModalProps): ReactNode {
  const [denialReason, setDenialReason] = useState("");

  const trimmedReason = denialReason.trim();
  const reasonIsValid =
    trimmedReason.length >= DENIAL_REASON_MIN_LENGTH &&
    trimmedReason.length <= DENIAL_REASON_MAX_LENGTH;

  return (
    <AdminModalShell
      eyebrow="DENY REQUEST"
      title={request.requestNumber}
      onClose={onClose}
      dismissible={!isSubmitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={BUTTON_CLASSES.ghost}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || !reasonIsValid}
            onClick={() => onConfirm(request.requestId, trimmedReason)}
            className={BUTTON_CLASSES.danger}
          >
            <X className="h-3.5 w-3.5" />
            {isSubmitting ? "Denying..." : "Deny"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          This can't be undone. The requester will see your reason in their
          request history.
        </p>

        <div>
          <label
            htmlFor="deny-reason"
            className="text-[10px] font-semibold tracking-wider text-gray-400"
          >
            REASON FOR DENIAL
          </label>
          <textarea
            id="deny-reason"
            value={denialReason}
            onChange={(event) => setDenialReason(event.target.value)}
            maxLength={DENIAL_REASON_MAX_LENGTH}
            rows={4}
            disabled={isSubmitting}
            placeholder="Let the requester know why this was denied"
            className="mt-1.5 w-full resize-none rounded-md border border-surface-border bg-white px-3 py-2 text-xs text-gray-700 outline-none placeholder:text-[#6d8b7b] focus:border-brand-secondary disabled:opacity-50"
          />
          <p className="mt-1 flex justify-between text-[10px] text-gray-400">
            <span>At least {DENIAL_REASON_MIN_LENGTH} characters</span>
            <span>
              {trimmedReason.length}/{DENIAL_REASON_MAX_LENGTH}
            </span>
          </p>
        </div>

        {errorMessage !== undefined && errorMessage !== "" && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </p>
        )}
      </div>
    </AdminModalShell>
  );
}
