import type { HaulingRequest } from "@bazoora/shared";
import {
  Modal,
  Button,
  StatusBadge
} from "@bazoora/ui";
import { STATUS_DISPLAY } from "../haulingRequestManagement.constants";

interface HaulingRequestDetailModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onApproveClick: () => void;
  onDenyClick: () => void;
}

/**
 * "View Details" modal for a single hauling request.
 *
 * Fields not yet on `HaulingRequest` (Fee Classification, split
 * Date Requested/Date Needed) render as static placeholders — the Prisma
 * schema isn't finalized. TODO: replace once the backend exposes them.
 */
export function HaulingRequestDetailModal({
  request,
  onClose,
  onApproveClick,
  onDenyClick,
}: HaulingRequestDetailModalProps) {
  return (
    <Modal title={request.requestId} onClose={onClose} width={640}>
      <div className="flex flex-col gap-4">
        <div className="w-full h-56 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          {request.imageUrl ? (
            <img
              src={request.imageUrl}
              alt={`Photo for ${request.requestId}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <svg
              className="w-14 h-14 text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 3l18 18M21 3L3 21" />
            </svg>
          )}
        </div>

        <DetailRow label="Location" value={request.requestAddress} />

        {/* TODO: wasteType not yet on HaulingRequest — backend/Prisma pending */}
        <DetailRow label="Waste Type" value="N/A" />

        {/* TODO: feeClassification not yet on HaulingRequest — backend/Prisma pending */}
        <DetailRow label="Fee Classification" value="N/A" />

        <DetailRow label="Sent By" value={request.senderType} />

        {/*
          TODO: Figma splits this into "Date Requested"/"Date Needed";
          HaulingRequest only has a single `pickupDate` today.
        */}
        <DetailRow label="Pickup Date" value={request.pickupDate} />

        {request.note && <DetailRow label="Note" value={request.note} />}

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-700">Status:</span>
          <StatusBadge status={STATUS_DISPLAY[request.status]} />
        </div>

        {request.status === "pending" && (
          <div className="flex justify-center gap-4 pt-2">
            <Button variant="primary" onClick={onApproveClick}>
              Approve
            </Button>
            <Button
              variant="secondary"
              className="bg-red-900 text-white"
              onClick={onDenyClick}
            >
              Deny
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center bg-gray-50 rounded-md overflow-hidden">
      <span className="w-40 shrink-0 bg-[#8fa89b] text-white text-sm font-semibold px-4 py-2.5">
        {label}
      </span>
      <span className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-800">
        {value}
      </span>
    </div>
  );
}