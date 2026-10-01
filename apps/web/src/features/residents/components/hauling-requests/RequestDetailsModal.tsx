import type { ReactNode } from "react";
import type { HaulingRequest } from "@bazoora/shared";

import { WASTE_TYPE_LABELS } from "./constants";
import { StatusBadge } from "./FormUi";

export default function RequestDetailsModal({
  request,
  onClose,
}: {
  request: HaulingRequest;
  onClose: () => void;
}): ReactNode {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] text-gray-400">REQUEST DETAILS</p>
            <h2 className="mt-1 text-lg font-bold text-gray-800">
              {request.requestNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close request details"
            className="text-xl text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <DetailRow label="WASTE TYPE">
            <p className="mt-1 text-sm font-medium text-gray-800">
              {WASTE_TYPE_LABELS[request.wasteType]}
            </p>
          </DetailRow>

          <DetailRow label="PICKUP DATE">
            <p className="mt-1 text-sm font-medium text-gray-800">
              {new Date(request.pickupDate).toLocaleString()}
            </p>
          </DetailRow>

          <DetailRow label="PICKUP ADDRESSES">
            <p className="mt-1 whitespace-pre-line text-sm font-medium text-gray-800">
              {request.requestAddress}
            </p>
          </DetailRow>

          <DetailRow label="STATUS">
            <StatusBadge status={request.status} className="mt-1 inline-flex" />
          </DetailRow>

          {request.note && (
            <DetailRow label="NOTE">
              <p className="mt-1 text-sm text-gray-700">{request.note}</p>
            </DetailRow>
          )}

          {request.imageUrl && (
            <DetailRow label="ATTACHED PHOTO">
              <img
                src={request.imageUrl}
                alt="Hauling request attachment"
                className="mt-1.5 max-h-48 w-full rounded-lg object-cover"
              />
            </DetailRow>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div>
      <p className="text-[9px] text-gray-400">{label}</p>
      {children}
    </div>
  );
}
