import type { ReactNode } from "react";
import type { HaulingRequest } from "@bazoora/shared";
import { Check, ImageOff, X } from "lucide-react";

import {
  SENDER_DISPLAY,
  WASTE_TYPE_DISPLAY,
} from "../haulingRequestManagement.constants";
import { formatDateTime, getPickupAddresses } from "../haulingRequestFormat";
import { AdminModalShell, BUTTON_CLASSES, DetailField } from "./AdminModalShell";
import { HaulingStatusBadge } from "./HaulingStatusBadge";

interface HaulingRequestDetailModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onApproveClick: () => void;
  onDenyClick: () => void;
}

/**
 * Details window for a single hauling request. Laid out like the resident
 * RequestDetailsModal, with Approve/Deny actions for pending requests.
 *
 * Fee Classification is not on `HaulingRequest` yet and renders as a
 * placeholder. TODO: replace once the backend exposes it.
 */
export function HaulingRequestDetailModal({
  request,
  onClose,
  onApproveClick,
  onDenyClick,
}: HaulingRequestDetailModalProps): ReactNode {
  const pickups = getPickupAddresses(request.requestAddress);
  const isPending = request.status === "PENDING";

  return (
    <AdminModalShell
      eyebrow="REQUEST DETAILS"
      title={request.requestNumber}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
      footer={
        isPending ? (
          <>
            <button type="button" onClick={onDenyClick} className={BUTTON_CLASSES.danger}>
              <X className="h-3.5 w-3.5" />
              Deny
            </button>
            <button type="button" onClick={onApproveClick} className={BUTTON_CLASSES.primary}>
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose} className={BUTTON_CLASSES.ghost}>
            Close
          </button>
        )
      }
    >
      <div className="grid gap-6 sm:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <HaulingStatusBadge status={request.status} />
            <span className="rounded-full border border-surface-border px-2.5 py-0.5 text-[10px] font-medium text-surface-muted">
              {SENDER_DISPLAY[request.senderType]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailField label="WASTE TYPE">
              {WASTE_TYPE_DISPLAY[request.wasteType]}
            </DetailField>

            {/* TODO: feeClassification not yet on HaulingRequest — backend/Prisma pending */}
            <DetailField label="FEE CLASSIFICATION">
              <span className="text-gray-400">N/A</span>
            </DetailField>

            <DetailField label="DATE REQUESTED">
              {formatDateTime(request.createdAt)}
            </DetailField>

            <DetailField label="PICKUP DATE">
              {formatDateTime(request.pickupDate)}
            </DetailField>
          </div>

          <DetailField
            label={
              pickups.length === 1
                ? "PICKUP ADDRESS"
                : `PICKUP ADDRESSES (${pickups.length})`
            }
          >
            <ol className="mt-1.5 space-y-2">
              {pickups.map((address, index) => (
                <li
                  key={`${index}-${address}`}
                  className="flex items-start gap-2.5 rounded-md border border-gray-200 px-3 py-2"
                >
                  {pickups.length > 1 && (
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[9px] font-semibold text-gray-600">
                      {index + 1}
                    </span>
                  )}
                  <span className="min-w-0 break-words">{address}</span>
                </li>
              ))}
            </ol>
          </DetailField>

          {request.note && (
            <DetailField label="NOTE">
              <p className="whitespace-pre-line font-normal text-gray-700">
                {request.note}
              </p>
            </DetailField>
          )}

          {request.status === "APPROVED" && request.approvedAt && (
            <DetailField label="APPROVED ON">
              {formatDateTime(request.approvedAt)}
            </DetailField>
          )}

          {request.status === "DENIED" && request.denialReason && (
            <DetailField label="DENIAL REASON">
              <p className="rounded-md bg-red-50 px-3 py-2 font-normal text-red-700">
                {request.denialReason}
              </p>
            </DetailField>
          )}
        </div>

        <DetailField label="ATTACHED PHOTO">
          <div className="mt-1.5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {request.imageUrl ? (
              <a href={request.imageUrl} target="_blank" rel="noreferrer" className="h-full w-full">
                <img
                  src={request.imageUrl}
                  alt={`Photo for ${request.requestNumber}`}
                  className="h-full w-full object-cover"
                />
              </a>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-gray-300">
                <ImageOff className="h-8 w-8" />
                <span className="text-[10px] font-medium text-gray-400">No photo</span>
              </div>
            )}
          </div>
        </DetailField>
      </div>
    </AdminModalShell>
  );
}
