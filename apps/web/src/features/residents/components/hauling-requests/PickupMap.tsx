import type { ReactNode } from "react";
import { Loader2, MapPin } from "lucide-react";

import SmartMap from "@/components/map/smart-map";
import type { MapMarker } from "@/components/map/smart-map";

import { DEFAULT_MAP_CENTER } from "./constants";
import type { LatLng, PickupAddress } from "./types";
import { FieldLabel } from "./FormUi";

export default function PickupMap({
  addresses,
  activeIndex,
  isResolving,
  onMapClick,
}: {
  addresses: PickupAddress[];
  activeIndex: number;
  isResolving: boolean;
  onMapClick: (position: LatLng) => void;
}): ReactNode {
  const activeAddress = addresses[activeIndex];

  // Follow the active address, then any located address, then the default.
  const center: LatLng =
    activeAddress?.position ??
    addresses.find((item) => item.position !== null)?.position ??
    DEFAULT_MAP_CENTER;

  // Only located addresses become markers.
  const markers: MapMarker[] = addresses.flatMap<MapMarker>((item, index) =>
    item.position
      ? [
          {
            id: item.id,
            position: item.position,
            label: item.address || `Pickup ${index + 1}`,
            icon: "stop",
            stopNumber: index + 1,
            pulse: index === activeIndex,
          },
        ]
      : [],
  );

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <FieldLabel>Pickup Map</FieldLabel>
        <span className="text-[8px] text-gray-400">
          Click map to set location
        </span>
      </div>

      <div className="relative h-85 w-full overflow-hidden rounded-lg border border-surface-border bg-gray-100">
        <SmartMap
          center={center}
          zoom={activeAddress?.position ? 16 : 12}
          markers={markers}
          onMapClick={onMapClick}
          className="h-full w-full"
        />

        <div className="pointer-events-none absolute left-3 top-3 z-1000">
          <div className="flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-[9px] font-semibold text-gray-700 shadow-md backdrop-blur">
            <MapPin className="h-3.5 w-3.5 text-brand-secondary" />
            {activeAddress ? `Pickup ${activeIndex + 1}` : "Pickup Location"}
          </div>
        </div>

        {isResolving && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-1000 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-md bg-black/75 px-3 py-2 text-[8px] font-medium text-white shadow-md">
              <Loader2 className="h-3 w-3 animate-spin" />
              Locating...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
