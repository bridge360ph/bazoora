import { useMemo, useState, type ReactNode } from "react";
import { FormField, Modal, ModalFooter } from "@bazoora/ui";
import type { HaulingRequest, Route } from "@bazoora/shared";

import { useHaulingRequests } from "@/features/hauling-requests/hooks/useHaulingRequests";
import { useCreatePaidHaulingRoute } from "@/features/hauling-requests/hooks/useCreatePaidHaulingRoute";
import { useHaulingFeasibility } from "@/features/hauling-requests/hooks/useHaulingFeasibility";
import { FeasibilityPanel } from "@/features/hauling-requests/components/FeasibilityPanel";
import { WASTE_TYPE_DISPLAY } from "@/features/hauling-requests/haulingRequestManagement.constants";
import {
  formatDateTime,
  getPickupAddresses,
} from "@/features/hauling-requests/haulingRequestFormat";
import type { LocatedPickup } from "@/features/hauling-requests/feasibilityApi";
import {
  isLocatedStop,
  toStopLocations,
  type EditableRouteStop,
} from "../route.types";
import { RouteStopsEditor } from "./RouteStopsEditor";

const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000;

const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900";

/** Today in Philippine time as YYYY-MM-DD. */
function manilaToday(): string {
  return new Date(Date.now() + MANILA_OFFSET_MS).toISOString().slice(0, 10);
}

/** An ISO time as Philippine date (YYYY-MM-DD) and time (HH:mm). */
function toManilaParts(iso: string): { date: string; time: string } | null {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  const local = new Date(time + MANILA_OFFSET_MS).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

/** Pending requests, and approved ones that are not on a route yet. */
function isEligible(request: HaulingRequest): boolean {
  if (request.archived) return false;
  if (request.status === "PENDING") return true;
  return request.status === "APPROVED" && !request.routeId;
}

function shortName(address: string): string {
  return address.split(",")[0]?.trim() || address;
}

function toEditableStops(
  request: HaulingRequest,
  pickups: LocatedPickup[],
): EditableRouteStop[] {
  return pickups.map((pickup, index) => ({
    id: `${request.requestId}-${index}`,
    name: `${index + 1}. ${shortName(pickup.address)}`,
    address: pickup.address,
    lat: pickup.lat,
    lng: pickup.lng,
  }));
}

/** Form values filled in from the request's preferred pickup. */
function defaultsFor(request: HaulingRequest) {
  const parts = toManilaParts(request.pickupDate);
  const today = manilaToday();
  const firstStop = shortName(getPickupAddresses(request.requestAddress)[0] ?? "");

  return {
    name: `Paid Hauling · ${request.requestNumber}`,
    barangay: firstStop.length >= 5 ? firstStop : "Paid hauling pickup",
    collectionDate: parts && parts.date >= today ? parts.date : today,
    startTime: parts?.time ?? "08:00",
  };
}

interface PaidRouteFormModalProps {
  onClose: () => void;
  onCreated: (route: Route, request: HaulingRequest) => void;
  /**
   * Opens the form for this request only, without the request list. Used
   * by Hauling Request Management after a feasibility check.
   */
  initialRequest?: HaulingRequest;
}

/**
 * Creates a Paid route for one hauling request: pick the request, review the
 * feasibility checks, adjust and optimize the checkpoints, pick a free
 * truck, and create. A pending request is approved by it.
 */
export function PaidRouteFormModal({
  onClose,
  onCreated,
  initialRequest,
}: PaidRouteFormModalProps): ReactNode {
  const { data: requests, isLoading, isError } = useHaulingRequests();
  const createMutation = useCreatePaidHaulingRoute();

  const initialDefaults = initialRequest ? defaultsFor(initialRequest) : null;
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequest?.requestId ?? null,
  );
  const [name, setName] = useState(initialDefaults?.name ?? "");
  const [barangay, setBarangay] = useState(initialDefaults?.barangay ?? "");
  const [collectionDate, setCollectionDate] = useState(
    initialDefaults?.collectionDate ?? "",
  );
  const [startTime, setStartTime] = useState(initialDefaults?.startTime ?? "08:00");
  const [truckId, setTruckId] = useState<string | null>(null);
  // Checkpoints the admin has changed, kept per request.
  const [editedStops, setEditedStops] = useState<{
    requestId: string;
    stops: EditableRouteStop[];
  } | null>(null);

  const eligible = useMemo(
    () => (requests ?? []).filter(isEligible),
    [requests],
  );
  const selected =
    eligible.find((request) => request.requestId === selectedId) ??
    (initialRequest && isEligible(initialRequest) ? initialRequest : null);
  const feasibility = useHaulingFeasibility(selected, selected !== null);

  const stops: EditableRouteStop[] =
    selected && editedStops?.requestId === selected.requestId
      ? editedStops.stops
      : selected && feasibility.pickupStops
        ? toEditableStops(selected, feasibility.pickupStops)
        : [];

  const availableTrucks = feasibility.result?.availableTrucks ?? [];
  const effectiveTruckId =
    truckId && availableTrucks.some((truck) => truck.id === truckId)
      ? truckId
      : (availableTrucks[0]?.id ?? "");

  function selectRequest(request: HaulingRequest) {
    const defaults = defaultsFor(request);

    setSelectedId(request.requestId);
    setEditedStops(null);
    setTruckId(null);
    setName(defaults.name);
    setBarangay(defaults.barangay);
    setCollectionDate(defaults.collectionDate);
    setStartTime(defaults.startTime);
    createMutation.reset();
  }

  const validationError = (() => {
    if (!selected) return "Choose a hauling request.";
    if (name.trim().length < 5) return "Route Name must be at least 5 characters.";
    if (barangay.trim().length < 5) return "Barangay Coverage must be at least 5 characters.";
    if (!collectionDate) return "Collection Date is required.";
    if (collectionDate < manilaToday()) return "The collection date cannot be in the past.";
    if (!startTime) return "Start Time is required.";
    if (stops.length === 0) {
      return feasibility.pickupStops ? "Add at least one checkpoint." : "Loading the checkpoints...";
    }
    if (!stops.every(isLocatedStop)) return "Place every checkpoint on the map, or remove it.";
    if (!effectiveTruckId) return "No free truck with a driver is available.";
    return null;
  })();

  function handleCreate() {
    if (!selected || validationError) return;

    createMutation.mutate(
      {
        requestId: selected.requestId,
        truckId: effectiveTruckId,
        name: name.trim(),
        barangay: barangay.trim(),
        collectionDate,
        startTime,
        stopLocations: toStopLocations(stops),
      },
      {
        onSuccess: (route) => onCreated(route, selected),
      },
    );
  }

  function handleClose() {
    if (!createMutation.isPending) onClose();
  }

  const saveLabel = createMutation.isPending
    ? "Creating..."
    : selected?.status === "PENDING"
      ? "Approve & Create Route"
      : "Create Route";

  return (
    <Modal title="Create Paid Route" onClose={handleClose} width={760}>
      {createMutation.error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {createMutation.error.message}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
          <span>Hauling Request</span>
          {initialRequest ? (
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm font-normal text-gray-700">
              <span className="font-semibold text-gray-900">{initialRequest.requestNumber}</span>
              {" · "}
              {WASTE_TYPE_DISPLAY[initialRequest.wasteType]} · Pickup{" "}
              {formatDateTime(initialRequest.pickupDate)}
            </p>
          ) : isLoading ? (
            <p className="text-sm text-gray-500">Loading hauling requests...</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Failed to load hauling requests.</p>
          ) : eligible.length === 0 ? (
            <p className="text-sm text-gray-500">
              No pending hauling requests, and every approved request is already on a route.
            </p>
          ) : (
            <ul className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200">
              {eligible.map((request) => {
                const stopCount = getPickupAddresses(request.requestAddress).length;
                const isSelected = request.requestId === selectedId;

                return (
                  <li key={request.requestId}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 px-3 py-2 transition ${
                        isSelected ? "bg-brand/5" : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paid-route-request"
                        checked={isSelected}
                        onChange={() => selectRequest(request)}
                        className="mt-1 accent-brand"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                          {request.requestNumber}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              request.status === "PENDING"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {request.status === "PENDING" ? "Pending" : "Approved"}
                          </span>
                        </span>
                        <span className="block text-xs font-normal text-gray-500">
                          {WASTE_TYPE_DISPLAY[request.wasteType]} · Pickup{" "}
                          {formatDateTime(request.pickupDate)} · {stopCount}{" "}
                          {stopCount === 1 ? "stop" : "stops"}
                          {stopCount > 1 &&
                            (request.keepStopOrder ? " · Follow resident's order" : " · Any order")}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected && (
          <>
            <FeasibilityPanel feasibility={feasibility} />

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Route Name" required>
                <input
                  value={name}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Barangay Coverage" required>
                <input
                  value={barangay}
                  maxLength={200}
                  onChange={(event) => setBarangay(event.target.value)}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Collection Date" required>
                <input
                  type="date"
                  value={collectionDate}
                  min={manilaToday()}
                  onChange={(event) => setCollectionDate(event.target.value)}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Start Time" required>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className={inputClassName}
                />
              </FormField>
            </div>

            {/* Not a FormField: that renders a <label>, which would swallow
                clicks on the map and the stop buttons inside it. */}
            <div className="flex flex-col gap-1.5 text-[13px] font-medium text-gray-700">
              <span>Checkpoints (pickup addresses)</span>
              {feasibility.pickupStops === null ? (
                <p className="text-sm font-normal text-gray-500">
                  Finding the pickup addresses on the map...
                </p>
              ) : (
                <RouteStopsEditor
                  stops={stops}
                  onChange={(next) =>
                    setEditedStops({ requestId: selected.requestId, stops: next })
                  }
                  barangay=""
                  {...(selected.keepStopOrder && {
                    optimizeLockedReason: "The resident asked for this stop order.",
                  })}
                />
              )}
            </div>

            <FormField label="Truck" required>
              {feasibility.result === null ? (
                <p className="text-sm text-gray-500">Loading free trucks...</p>
              ) : availableTrucks.length === 0 ? (
                <p className="text-sm text-red-600">
                  No free truck with a driver. Free a truck from another route or register one in
                  Fleet Management.
                </p>
              ) : (
                <select
                  value={effectiveTruckId}
                  onChange={(event) => setTruckId(event.target.value)}
                  className={`${inputClassName} cursor-pointer`}
                >
                  {availableTrucks.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      {[truck.truckNumber, truck.plateNumber, truck.driverName ?? "No driver name"]
                        .filter(Boolean)
                        .join(" · ")}
                    </option>
                  ))}
                </select>
              )}
            </FormField>
          </>
        )}

        {validationError && selected && (
          <p className="text-sm text-gray-500">{validationError}</p>
        )}
      </div>

      <ModalFooter
        saveLabel={saveLabel}
        onSave={handleCreate}
        onClose={handleClose}
        saveDisabled={validationError !== null || createMutation.isPending}
      />
    </Modal>
  );
}
