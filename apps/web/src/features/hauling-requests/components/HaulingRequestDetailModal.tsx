import type { HaulingRequest } from "@bazoora/shared";
import {
  Modal,
  Button,
  StatusBadge,
} from "@bazoora/ui";
import { STATUS_DISPLAY } from "../haulingRequestManagement.constants";

interface HaulingRequestDetailModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onApproveClick: () => void;
  onDenyClick: () => void;
}

function formatWasteType(type: HaulingRequest["wasteType"]) {
  return type
    .toLowerCase()
    .replace("_", " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

/**
 * "View Details" modal for a single hauling request.
 * 
 * Fields not yet supported by the backend (Fee Classification,
 * Date Requested/Date Needed split) render as placeholders.
 */
export function HaulingRequestDetailModal({
  request,
  onClose,
  onApproveClick,
  onDenyClick,
}: HaulingRequestDetailModalProps) {
  return (
    <Modal title={request.requestNumber} onClose={onClose} width={640}>
      <div className="flex flex-col gap-4">
        <div className="w-full h-56 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          {request.imageUrl ? (
            <img
              src={request.imageUrl}
              alt={`Photo for ${request.requestNumber}`}
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

        <DetailRow
          label="Waste Type"
          value={formatWasteType(request.wasteType)}
        />

        {/* Fields not yet supported by the backend (Fee Classification,
            Date Requested/Date Needed split) render as placeholders.  */}
        <DetailRow label="Fee Classification" value="N/A" />

        <DetailRow label="Sent By" value={request.senderType} />

        {/*
          TODO: Figma splits this into "Date Requested"/"Date Needed";
          HaulingRequest only has a single `pickupDate` today.
        */}
        <DetailRow
          label="Pickup Date"
          value={
            request.pickupDate
              ? new Date(request.pickupDate).toLocaleString()
              : "N/A"
          }
        />

        {request.note && <DetailRow label="Note" value={request.note} />}

        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-700">Status:</span>
          <StatusBadge status={STATUS_DISPLAY[request.status]} />
        </div>

        {request.status === "DENIED" && request.denialReason && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm font-semibold text-red-700">
              Denial Reason
            </p>

            <p className="text-sm text-red-600 mt-1">
              {request.denialReason}
            </p>
          </div>
        )}

        {request.status === "PENDING" && (
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

