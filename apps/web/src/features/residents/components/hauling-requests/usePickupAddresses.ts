import { useState } from "react";

import { geocode, reverseGeocode } from "@/lib/geocoding";

import { MAX_ADDRESS_LENGTH, MAX_PICKUP_ADDRESSES } from "./constants";
import type { LatLng, PickupAddress } from "./types";
import { createEmptyAddress, formatCoordinates } from "./utils";

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

      updateById(target.id, {
        address: clampAddress(match.display_name?.trim() || query),
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

    try {
      const result = await reverseGeocode(position[0], position[1]);

      updateById(target.id, {
        address: clampAddress(
          result?.display_name?.trim() || formatCoordinates(position),
        ),
        position,
      });
    } catch (error) {
      console.error("Failed to reverse geocode map location:", error);
      updateById(target.id, { address: formatCoordinates(position), position });
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
    addAddress,
    removeAddress,
    reset,
  };
}
