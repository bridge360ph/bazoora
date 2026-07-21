import { useState } from "react";
import type { HaulingRequest } from "@bazoora/shared";
import {
  Modal,
  Button,
} from "@bazoora/ui";

interface DenyHaulingRequestModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onConfirm: (
    requestId: string,
    denialReason: string,
  ) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

export function DenyHaulingRequestModal({
  request,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}: DenyHaulingRequestModalProps) {
  const [denialReason, setDenialReason] = useState("");

  const trimmedReason = denialReason.trim();

  const isValid =
    trimmedReason.length >= 5 &&
    trimmedReason.length <= 500;

  return (
    <Modal title="Deny Request" onClose={onClose} width={420}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to deny request{" "}
          <span className="font-semibold text-gray-900">
            {request.requestNumber}
          </span>
          ?
        </p>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Reason for denial
          </label>

          <textarea
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            placeholder="Enter reason for denying this request..."
            maxLength={500}
            rows={4}
            className="w-full border rounded-md px-3 py-2 text-sm"
          />

          <div className="flex justify-between mt-1">
            <div>
              {trimmedReason.length > 0 &&
                trimmedReason.length < 5 && (
                  <p className="text-sm text-red-600">
                    Reason must be at least 5 characters.
                  </p>
                )}

              {trimmedReason.length === 0 && (
                <p className="text-sm text-red-600">
                  Denial reason is required.
                </p>
              )}

              {errorMessage && (
                <p className="text-sm text-red-600">
                  {errorMessage}
                </p>
              )}
            </div>

            <p className="text-xs text-gray-500">
              {denialReason.length}/500
            </p>
          </div>

            <p className="text-xs text-gray-500">
              {denialReason.length}/500
            </p>
          </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="secondary"
            className="bg-red-900 text-white"
            disabled={isSubmitting || !isValid}
            onClick={() =>
              onConfirm(
                request.requestId,
                trimmedReason,
              )
            }
          >
            {isSubmitting ? "Denying..." : "Deny"}
          </Button>

          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}