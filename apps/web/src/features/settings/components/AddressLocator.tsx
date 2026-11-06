import { useState, type ReactNode } from "react";
import { CheckCircle2, Loader2, MapPin, Search } from "lucide-react";

import SmartMap from "@/components/map/smart-map";
import { geocode, reverseGeocode } from "@/lib/geocoding";

export type LatLng = [number, number];

// Makati, until the address is located.
const DEFAULT_CENTER: LatLng = [14.5547, 121.0244];

interface AddressLocatorProps {
  /** The full address, tried first. */
  fullAddress: string;
  /** Barangay, city and province only, tried when the street is not found. */
  areaAddress: string;
  position: LatLng | null;
  onPositionChange: (position: LatLng) => void;
  error?: string | undefined;
}

/**
 * Finds the saved address on the map. The address is looked up first, and
 * the pin can then be moved by clicking the map so it sits on the house.
 */
export function AddressLocator({
  fullAddress,
  areaAddress,
  position,
  onPositionChange,
  error,
}: AddressLocatorProps): ReactNode {
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function locate() {
    setIsLocating(true);
    setMessage(null);

    try {
      for (const [index, query] of [fullAddress, areaAddress].entries()) {
        if (!query.trim()) continue;
        const [match] = await geocode(query, { limit: 1, countryCodes: "ph" });

        if (match) {
          onPositionChange([match.lat, match.lon]);
          setMessage(
            index === 0
              ? "Address found. Click the map to move the pin onto your house if needed."
              : "Your street was not found, so the pin is in your barangay. Click the map to place it on your house.",
          );
          return;
        }
      }

      setMessage("Your address was not found on the map. Click the map to place the pin.");
    } catch {
      setMessage("Address search is unavailable. Click the map to place the pin.");
    } finally {
      setIsLocating(false);
    }
  }

  async function pin(next: LatLng) {
    onPositionChange(next);

    try {
      const result = await reverseGeocode(next[0], next[1]);
      setMessage(result.display_name ? `Pin placed near ${result.display_name}.` : "Pin placed.");
    } catch {
      setMessage("Pin placed.");
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-400">
          Location on Map
          <span aria-hidden="true" className="ml-1 text-red-500">*</span>
        </span>
        <button
          type="button"
          onClick={() => void locate()}
          disabled={isLocating || !areaAddress.trim()}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLocating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Find on Map
        </button>
      </div>

      <div
        className={`relative h-56 overflow-hidden rounded-lg border ${
          error ? "border-red-400" : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <SmartMap
          center={position ?? DEFAULT_CENTER}
          zoom={position ? 17 : 12}
          markers={
            position
              ? [{ id: "home", position, label: "Your address", icon: "home" }]
              : []
          }
          onMapClick={(next) => {
            void pin(next);
          }}
          className="h-full w-full"
        />
        <p className="pointer-events-none absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-[11px] text-gray-600 shadow-sm">
          Click the map to place or move the pin
        </p>
      </div>

      <p
        className={`mt-1.5 flex items-center gap-1.5 text-xs ${
          error ? "text-red-600" : position ? "text-green-700" : "text-gray-500"
        }`}
      >
        {position && !error ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <MapPin className="h-3.5 w-3.5 shrink-0" />
        )}
        {error ??
          (position
            ? "Location set. It is used as your default pickup address."
            : "Fill in your address, then click Find on Map.")}
      </p>

      {message && !error && <p className="mt-1 text-xs text-gray-500">{message}</p>}
    </div>
  );
}
