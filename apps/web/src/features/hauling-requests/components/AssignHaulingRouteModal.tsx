import { useState, type ReactNode } from "react";
import type { HaulingRequest } from "@bazoora/shared";
import { Check } from "lucide-react";

import { WASTE_TYPE_DISPLAY } from "../haulingRequestManagement.constants";
import { AdminModalShell, BUTTON_CLASSES } from "./AdminModalShell";
import { HaulingRouteSelect } from "./HaulingRouteSelect";

interface AssignHaulingRouteModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onConfirm: (requestId: string, routeId: string | null) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

/**
 * Assigns, changes or clears the route of an approved hauling request, for
 * when no route was picked at approval time or the plan changes.
 */
export function AssignHaulingRouteModal({
  request,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}: AssignHaulingRouteModalProps): ReactNode {
  const currentRouteId = request.routeId ?? null;
  const [routeId, setRouteId] = useState<string | null>(currentRouteId);
  const hasChanged = routeId !== currentRouteId;

  return (
    <AdminModalShell
      eyebrow="ASSIGN ROUTE"
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
            disabled={isSubmitting || !hasChanged}
            onClick={() => onConfirm(request.requestId, routeId)}
            className={BUTTON_CLASSES.primary}
          >
            <Check className="h-3.5 w-3.5" />
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {WASTE_TYPE_DISPLAY[request.wasteType]}
        </p>

        <div>
          <label
            htmlFor="assign-route"
            className="text-[10px] font-semibold tracking-wider text-gray-400"
          >
            ROUTE
          </label>
          <HaulingRouteSelect
            id="assign-route"
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
