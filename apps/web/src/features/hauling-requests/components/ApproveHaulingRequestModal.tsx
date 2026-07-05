import { useState } from "react";
import type { HaulingRequest } from "@bazoora/shared";
import { Modal } from "../../../components/Modal";
import { Button } from "../../../components/Button";

interface ApproveHaulingRequestModalProps {
  request: HaulingRequest;
  onClose: () => void;
  onConfirm: (requestId: string) => void;
  isSubmitting: boolean;
}

/**
 * Confirmation modal for approving a hauling request.
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
}: ApproveHaulingRequestModalProps) {
  // Static placeholder — TODO: replace once a GET /eco-aides endpoint exists.
  const [ecoAideStub] = useState("Ferdinan Ramos (RT-001)");

  return (
    <Modal title="Approve Request" onClose={onClose} width={480}>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Assign Eco-Aide and Route
          </label>
          <select
            disabled
            value={ecoAideStub}
            title="Coming soon — Eco-Aide assignment is not yet supported by the backend"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
          >
            <option>{ecoAideStub}</option>
          </select>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="primary"
            disabled={isSubmitting}
            onClick={() => onConfirm(request.requestId)}
          >
            {isSubmitting ? "Approving..." : "Approve"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}