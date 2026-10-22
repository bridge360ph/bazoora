import { MIN_ADDRESS_LENGTH } from "./constants";
import type { PickupAddress, WasteType } from "./types";

export function getFilledAddresses(addresses: PickupAddress[]): PickupAddress[] {
  return addresses.filter((item) => item.address.trim().length > 0);
}

/** Returns the first validation error, or null if the request is valid. */
export function validateRequest({
  wasteType,
  addresses,
  pickupDate,
}: {
  wasteType: WasteType | "";
  addresses: PickupAddress[];
  pickupDate: string;
}): string | null {
  if (!wasteType) {
    return "Please select a waste type.";
  }

  const filled = getFilledAddresses(addresses);

  if (filled.length === 0) {
    return "Please add at least one pickup address.";
  }

  if (filled.some((item) => !item.position)) {
    return "Please locate every pickup address using the search or map.";
  }

  if (filled.some((item) => item.address.trim().length < MIN_ADDRESS_LENGTH)) {
    return `Each pickup address must be at least ${MIN_ADDRESS_LENGTH} characters.`;
  }

  if (!pickupDate) {
    return "Please select a pickup date.";
  }

  return null;
}

/**
 * The backend still expects a single address string,
 * so multiple pickups are joined with line breaks.
 */
export function combineAddresses(addresses: PickupAddress[]): string {
  return addresses
    .map((item, index) => `Pickup ${index + 1}: ${item.address.trim()}`)
    .join("\n");
}
