import { useState, type ReactNode } from "react";
import type { HaulingRequest } from "@bazoora/shared";
import { Check } from "lucide-react";

import { WASTE_TYPE_DISPLAY } from "../haulingRequestManagement.constants";
import { formatDateTime } from "../haulingRequestFormat";
import { AdminModalShell, BUTTON_CLASSES } from "./AdminModalShell";
import { HaulingRouteSelect } from "./HaulingRouteSelect";

interface ApproveHaulingRequestModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onConfirm: (requestId: string, routeId: string | null) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

/**
 * Confirmation window for approving a hauling request.
 *
 * The admin can assign a collection route here. It is optional, because a
 * suitable route may not exist yet; the route can then be assigned later
 * from the request details. Picking a route also brings in its eco-aide,
 * since the eco-aide belongs to the route.
 */
export function ApproveHaulingRequestModal({
  request,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}: ApproveHaulingRequestModalProps): ReactNode {
  const [routeId, setRouteId] = useState<string | null>(null);

  return (
    <AdminModalShell
      eyebrow="APPROVE REQUEST"
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
            disabled={isSubmitting}
            onClick={() => onConfirm(request.requestId, routeId)}
            className={BUTTON_CLASSES.primary}
          >
            <Check className="h-3.5 w-3.5" />
            {isSubmitting ? "Approving..." : "Approve"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-surface-border bg-[#f8fbf9] px-4 py-3">
          <p className="text-sm font-bold text-gray-800">
            {WASTE_TYPE_DISPLAY[request.wasteType]}
          </p>
          <p className="mt-0.5 text-xs text-surface-muted">
            Preferred pickup {formatDateTime(request.pickupDate)}
          </p>
        </div>

        <p className="text-sm text-gray-600">
          The requester will see this request as approved.
        </p>

        <div>
          <label
            htmlFor="approve-route"
            className="text-[10px] font-semibold tracking-wider text-gray-400"
          >
            ASSIGN ROUTE (OPTIONAL)
          </label>
          <HaulingRouteSelect
            id="approve-route"
            requestId={request.requestId}
            value={routeId}
            onChange={setRouteId}
            disabled={isSubmitting}
          />
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
