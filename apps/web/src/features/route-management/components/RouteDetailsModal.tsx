import { MapPreviewPlaceholder, Modal, ModalFooter } from "@bazoora/ui";
import type { Route } from "@bazoora/shared";

interface RouteDetailsModalProps {
  route: Route;
  onClose: () => void;
}

export function RouteDetailsModal({ route, onClose }: RouteDetailsModalProps) {
  return (
    <Modal title="Route Details" onClose={onClose} width={820}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(220px,320px)] gap-x-10 gap-y-4 rounded-xl bg-[#1a3a2e] px-8 py-7">
        <div className="flex flex-col gap-2.5">
          <DetailItem
            label="Route Number"
            value={`RT-${String(route.routeNumber).padStart(3, "0")}`}
          />
          <DetailItem label="Route Name" value={route.name} />
          <DetailItem label="Barangay Coverage" value={route.barangay} />
          <DetailItem label="Waypoint / Collection Points" value={route.waypoints} />
          <DetailItem label="Waste Type" value={route.wasteType} />
          <DetailItem label="Route Type" value={route.routeType} />
          <DetailItem
            label="Start Time"
            value={`3/26/2026 ${route.startTime} (${route.collectionDay})`}
          />
          <DetailItem label="Assigned Eco-Aide" value={route.assignedEcoAideId ?? "Unassigned"} />
          <DetailItem
            label="Fleet Assignment"
            value={`${route.assignedTruckId ?? "Unassigned"} Isuzu`}
          />
        </div>

        <div className="min-h-[240px] overflow-hidden rounded-lg bg-[#e8ece8]">
          <MapPreviewPlaceholder />
        </div>
      </div>

      <ModalFooter saveLabel="Back" onSave={onClose} onClose={onClose} />
    </Modal>
  );
}

interface DetailItemProps {
  label: string;
  value: string | number;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <p className="m-0 text-sm text-white/90">
      <strong>{label}:</strong> {value}
    </p>
  );
}
