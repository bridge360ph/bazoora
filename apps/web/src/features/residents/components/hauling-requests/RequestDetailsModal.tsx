import type { ReactNode } from "react";
import type { HaulingRequest } from "@bazoora/shared";

import { WASTE_TYPE_LABELS } from "./constants";
import {
  formatDateTime,
  formatScheduledCollection,
} from "@/features/hauling-requests/haulingRequestFormat";
import { StatusBadge } from "./FormUi";
import { splitPickupAddresses } from "./utils";

export default function RequestDetailsModal({
  request,
  onClose,
}: {
  request: HaulingRequest;
  onClose: () => void;
}): ReactNode {
  const addresses = splitPickupAddresses(request.requestAddress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5">
      <div className="max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
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

          <DetailRow label="PREFERRED PICKUP">
            <p className="mt-1 text-sm font-medium text-gray-800">
              {formatDateTime(request.pickupDate)}
            </p>
          </DetailRow>

          <DetailRow
            label={
              addresses.length === 1
                ? "PICKUP ADDRESS"
                : `PICKUP ADDRESSES (${addresses.length})`
            }
          >
            <ol className="mt-1.5 space-y-2">
              {addresses.map((address, index) => (
                <li
                  key={`${index}-${address}`}
                  className="flex items-start gap-2.5 rounded-md border border-gray-200 px-3 py-2"
                >
                  {addresses.length > 1 && (
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[9px] font-semibold text-gray-600">
                      {index + 1}
                    </span>
                  )}

                  <span className="min-w-0 wrap-break-words text-sm font-medium text-gray-800">
                    {address}
                  </span>
                </li>
              ))}
            </ol>
          </DetailRow>

          <DetailRow label="STATUS">
            <StatusBadge status={request.status} className="mt-1 inline-flex" />
          </DetailRow>

          {request.status === "APPROVED" && (
            <DetailRow label="SCHEDULED COLLECTION">
              {request.route ? (
                <>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {formatScheduledCollection(request.route.scheduledCollectionAt)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {request.route.routeDisplayNumber} · {request.route.name}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    The truck collects on its route&apos;s next run on or after
                    your preferred pickup date.
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  To be scheduled once your request is assigned to a route.
                </p>
              )}
            </DetailRow>
          )}

          {request.status === "DENIED" && request.denialReason && (
            <DetailRow label="REASON FOR DENIAL">
              <p className="mt-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {request.denialReason}
              </p>
            </DetailRow>
          )}

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
