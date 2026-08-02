import { useState } from "react";
import type {
  HaulingRequest,
  Route,
  AssignedEcoAide,
} from "@bazoora/shared";

import {
  Modal,
  Button,
} from "@bazoora/ui";

interface ApproveHaulingRequestModalProps {
  request: HaulingRequest;
  assignableRoutes: (Route & { assignedEcoAide: AssignedEcoAide })[];
  onClose: () => void;
  onConfirm: (
    requestId: string,
    routeId: string,
  ) => void;
  isSubmitting: boolean;
}

/**
 * Confirmation modal for approving a hauling request.
 *
 * `assignableRoutes` is pre-filtered by the parent to only Routes with an
 * assigned Eco-Aide — this component just renders the list and tracks which
 * one is selected. HaulingRequest has no Route relationship yet, so
 * selecting a route here doesn't persist anything server-side yet; see
 * handleApprove in AdminHaulingRequestManagementPage.
 */

export function ApproveHaulingRequestModal({
  request,
  assignableRoutes,
  onClose,
  onConfirm,
  isSubmitting,
}: ApproveHaulingRequestModalProps) {
  const [selectedRouteId, setSelectedRouteId] =
    useState("");

  return (
    <Modal
      title="Approve Request"
      onClose={onClose}
      width={480}
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Assign Eco-Aide and Route
          </label>

          <select
            value={selectedRouteId}
            onChange={(e) =>
              setSelectedRouteId(e.target.value)
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">
              Select a route
            </option>

            {assignableRoutes.map((route) => (
              <option
                key={route.id}
                value={route.id}
              >
                {route.assignedEcoAide.name}
                {" ("}
                {route.assignedEcoAide.userNumber}
                {") — "}
                {route.routeDisplayNumber}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="primary"
            disabled={
              isSubmitting ||
              !selectedRouteId
            }
            onClick={() =>
              onConfirm(
                request.requestId,
                selectedRouteId,
              )
            }
          >
            {isSubmitting
              ? "Approving..."
              : "Approve"}
          </Button>

          <Button
            variant="secondary"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
