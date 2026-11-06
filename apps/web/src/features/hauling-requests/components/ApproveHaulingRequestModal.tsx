import type { ReactNode } from "react";
import type { HaulingRequest } from "@bazoora/shared";
import { Check, ChevronDown } from "lucide-react";

import { WASTE_TYPE_DISPLAY } from "../haulingRequestManagement.constants";
import { formatDateTime } from "../haulingRequestFormat";
import { AdminModalShell, BUTTON_CLASSES } from "./AdminModalShell";

interface ApproveHaulingRequestModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onConfirm: (requestId: string) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

// Static placeholder — TODO: replace once a GET /eco-aides endpoint exists.
const ECO_AIDE_PLACEHOLDER = "Ferdinan Ramos (RT-001)";

/**
 * Confirmation window for approving a hauling request.
 *
 * The Figma design includes an "Assign Eco-Aide and Route" dropdown, but
 * `HaulingRequest` has no Eco-Aide/route field yet and there's no
 * `/eco-aides` endpoint to populate it. Rendered as a static, disabled
 * select so the layout matches — TODO: wire up once the backend supports
 * Eco-Aide assignment (Prisma schema not finalized).
 */
export function ApproveHaulingRequestModal({
  request,
  onClose,
  onConfirm,
  isSubmitting,
  errorMessage,
}: ApproveHaulingRequestModalProps): ReactNode {
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
            onClick={() => onConfirm(request.requestId)}
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
            Pickup {formatDateTime(request.pickupDate)}
          </p>
        </div>

        <p className="text-sm text-gray-600">
          The requester will see this request as approved.
        </p>

        <div>
          <label
            htmlFor="approve-eco-aide"
            className="text-[10px] font-semibold tracking-wider text-gray-400"
          >
            ASSIGN ECO-AIDE AND ROUTE
          </label>
          <div className="relative mt-1.5">
            <select
              id="approve-eco-aide"
              disabled
              value={ECO_AIDE_PLACEHOLDER}
              title="Coming soon — Eco-Aide assignment is not yet supported by the backend"
              className="h-9 w-full cursor-not-allowed appearance-none rounded-md border border-surface-border bg-gray-50 px-3 pr-9 text-xs text-gray-400"
            >
              <option>{ECO_AIDE_PLACEHOLDER}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
          </div>
          <p className="mt-1 text-[10px] text-gray-400">Coming soon</p>
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
