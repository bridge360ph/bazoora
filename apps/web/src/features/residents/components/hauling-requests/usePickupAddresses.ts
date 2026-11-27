import { useState } from "react";

import { geocode, reverseGeocode } from "@/lib/geocoding";

import { MAX_ADDRESS_LENGTH, MAX_PICKUP_ADDRESSES } from "./constants";
import type { LatLng, PickupAddress } from "./types";
import {
  DUPLICATE_PICKUP_MESSAGE,
  createEmptyAddress,
  formatCoordinates,
  isDuplicatePickup,
} from "./utils";

/**
 * Owns the list of pickup addresses, which one is active,
 * and resolving addresses to map positions (and back).
 */
export function usePickupAddresses({
  onError,
}: {
  onError: (message: string | null) => void;
}) {
  const [addresses, setAddresses] = useState<PickupAddress[]>(() => [
    createEmptyAddress(),
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isResolving, setIsResolving] = useState(false);

  function updateAt(index: number, patch: Partial<PickupAddress>) {
    setAddresses((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  /**
   * Geocoding results arrive after an await, by which time rows may have been
   * added or removed. Patch by the row's stable id so a result can never land
   * on a different address; if the row is gone, the result is dropped.
   */
  function updateById(id: string, patch: Partial<PickupAddress>) {
    setAddresses((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function clampAddress(value: string): string {
    return value.slice(0, MAX_ADDRESS_LENGTH);
  }

  /** Typing clears any previously resolved position. */
  function changeAddress(index: number, value: string) {
    updateAt(index, { address: clampAddress(value), position: null });
    setActiveIndex(index);
    onError(null);
  }

  async function resolveAddress(index: number) {
    const target = addresses[index];
    const query = target?.address.trim();

    if (!target || !query) return;

    setActiveIndex(index);
    setIsResolving(true);
    onError(null);

    try {
      const [match] =
        (await geocode(query, { limit: 1, countryCodes: "ph" })) ?? [];

      if (!match?.lat || !match?.lon) {
        onError("Address could not be located. Try a more specific address.");
        return;
      }

      const lat = Number(match.lat);
      const lng = Number(match.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        onError("The selected address has invalid coordinates.");
        return;
      }

      const address = clampAddress(match.display_name?.trim() || query);

      if (isDuplicatePickup(addresses, target.id, address, [lat, lng])) {
        onError(DUPLICATE_PICKUP_MESSAGE);
        return;
      }

      updateById(target.id, {
        address,
        position: [lat, lng],
      });
    } catch (error) {
      console.error("Failed to resolve pickup address:", error);
      onError(
        "Unable to locate that address. Try again or select a location from the map.",
      );
    } finally {
      setIsResolving(false);
    }
  }

  /** Sets the active address from a map click, falling back to raw coordinates. */
  async function selectMapPosition(position: LatLng) {
    const target = addresses[activeIndex];

    if (!target) return;

    setIsResolving(true);
    onError(null);

    let address = formatCoordinates(position);

    try {
      const result = await reverseGeocode(position[0], position[1]);
      address = clampAddress(result?.display_name?.trim() || address);
    } catch (error) {
      console.error("Failed to reverse geocode map location:", error);
    }

    try {
      if (isDuplicatePickup(addresses, target.id, address, position)) {
        onError(DUPLICATE_PICKUP_MESSAGE);
        return;
      }

      updateById(target.id, { address, position });
    } finally {
      setIsResolving(false);
    }
  }

  /**
   * Puts the address saved in Settings into the first empty row (or a new
   * one) and finds it on the map. The street is tried first, then only the
   * barangay and city if the street is not on the map.
   */
  async function applySavedAddress(saved: {
    label: string;
    areaLabel: string;
    position: LatLng | null;
  }) {
    if (isDuplicatePickup(addresses, "", saved.label, saved.position)) {
      onError(DUPLICATE_PICKUP_MESSAGE);
      return;
    }

    const emptyIndex = addresses.findIndex((item) => !item.address.trim());

    if (emptyIndex === -1 && addresses.length >= MAX_PICKUP_ADDRESSES) {
      onError(`You can add up to ${MAX_PICKUP_ADDRESSES} pickup addresses.`);
      return;
    }

    const row = emptyIndex === -1 ? createEmptyAddress() : addresses[emptyIndex];
    if (!row) return;

    const address = clampAddress(saved.label);

    // The pin placed in Settings is used as is, with no lookup.
    const position = saved.position;

    if (emptyIndex === -1) {
      setAddresses((current) => [...current, { ...row, address, position }]);
      setActiveIndex(addresses.length);
    } else {
      updateById(row.id, { address, position });
      setActiveIndex(emptyIndex);
    }

    if (position) {
      onError(null);
      return;
    }

    setIsResolving(true);
    onError(null);

    try {
      for (const query of [saved.label, saved.areaLabel]) {
        const [match] = (await geocode(query, { limit: 1, countryCodes: "ph" })) ?? [];
        const lat = Number(match?.lat);
        const lng = Number(match?.lon);

        if (match && Number.isFinite(lat) && Number.isFinite(lng)) {
          if (isDuplicatePickup(addresses, row.id, "", [lat, lng])) {
            updateById(row.id, { address: "", position: null });
            onError(DUPLICATE_PICKUP_MESSAGE);
            return;
          }

          updateById(row.id, { position: [lat, lng] });
          return;
        }
      }

      onError("Your saved address could not be found on the map. Click the map to place it.");
    } catch (error) {
      console.error("Failed to locate the saved address:", error);
      onError("Unable to locate your saved address. Click the map to place it.");
    } finally {
      setIsResolving(false);
    }
  }

  function addAddress() {
    if (addresses.length >= MAX_PICKUP_ADDRESSES) return;

    setActiveIndex(addresses.length);
    setAddresses((current) => [...current, createEmptyAddress()]);
  }

  /** Removing the last remaining address clears it instead. */
  function removeAddress(index: number) {
    setAddresses((current) => {
      if (current.length === 1) {
        return [{ ...current[0], address: "", position: null }];
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });

    setActiveIndex((current) => {
      if (current > index) return current - 1;
      if (current === index) return Math.max(0, current - 1);
      return current;
    });
  }

  function reset() {
    setAddresses([createEmptyAddress()]);
    setActiveIndex(0);
  }

  return {
    addresses,
    activeIndex,
    activeAddress: addresses[activeIndex],
    isResolving,
    canAddAddress: addresses.length < MAX_PICKUP_ADDRESSES,
    setActiveIndex,
    changeAddress,
    resolveAddress,
    selectMapPosition,
    applySavedAddress,
    addAddress,
    removeAddress,
    reset,
  };
}
