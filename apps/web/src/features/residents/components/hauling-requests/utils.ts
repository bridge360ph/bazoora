import type { LatLng, PickupAddress } from "./types";

export function getStatusClasses(status: string): string {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-700";
    case "DENIED":
      return "bg-red-100 text-red-700";
    case "PENDING":
    default:
      return "bg-orange-100 text-orange-700";
  }
}

/** Ignores case, spacing and punctuation, so "12 Rizal St." matches "12 rizal st". */
export function normalizeAddress(address: string): string {
  return address
    .replace(/^\s*Pickup\s+\d+:\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Two pins closer than this are the same place.
const SAME_PLACE_METERS = 15;

function metersBetween([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** True when another row already has this address or a pin at the same place. */
export function isDuplicatePickup(
  addresses: PickupAddress[],
  rowId: string,
  address: string,
  position: LatLng | null,
): boolean {
  const normalized = normalizeAddress(address);

  return addresses.some(
    (item) =>
      item.id !== rowId &&
      ((normalized !== "" && normalizeAddress(item.address) === normalized) ||
        (position !== null &&
          item.position !== null &&
          metersBetween(item.position, position) < SAME_PLACE_METERS)),
  );
}

export const DUPLICATE_PICKUP_MESSAGE = "This pickup address is already listed.";

export function createEmptyAddress(): PickupAddress {
  return { id: crypto.randomUUID(), address: "", position: null };
}

export function formatCoordinates([lat, lng]: LatLng): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/** Current local time in the `YYYY-MM-DDTHH:mm` format used by datetime-local inputs. */
export function getMinimumDateTime(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

/** Reads a file and returns its contents as base64, without the data URL prefix. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Failed to read image file."));
        return;
      }

      const base64 = result.split(",")[1];

      if (!base64) {
        reject(new Error("Invalid image data."));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => reject(new Error("Failed to read image file."));

    reader.readAsDataURL(file);
  });
}

/**
 * The request form joins multiple pickups into one string as
 * "Pickup 1: <address>\nPickup 2: <address>" (see combineAddresses).
 * This splits it back into one address per stop.
 */
export function splitPickupAddresses(requestAddress: string): string[] {
  const addresses = requestAddress
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*Pickup\s+\d+:\s*/i, "").trim())
    .filter((line) => line.length > 0);

  return addresses.length > 0 ? addresses : [requestAddress];
}
