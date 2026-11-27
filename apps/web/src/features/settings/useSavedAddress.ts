import { useQuery } from "@tanstack/react-query";

import { getMySettings } from "./api";

export interface SavedAddress {
  /** Street, barangay, city and province joined, as shown to the user. */
  label: string;
  /** Barangay, city and province only, used when the street is not on the map. */
  areaLabel: string;
  /** The pin placed in Settings, when there is one. */
  position: [number, number] | null;
}

/**
 * The address the signed-in user saved in Settings, or null when none is
 * saved. Read from the server so it is current on every device.
 */
export function useSavedAddress() {
  const query = useQuery({
    queryKey: ["my-settings"],
    queryFn: getMySettings,
    staleTime: 60_000,
  });

  const profile = query.data?.profile;
  const area = [profile?.barangay, profile?.cityMunicipality, profile?.province]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  const street = profile?.streetAddress?.trim() ?? "";
  const label = [street, area].filter(Boolean).join(", ");

  const position: [number, number] | null =
    typeof profile?.latitude === "number" && typeof profile.longitude === "number"
      ? [profile.latitude, profile.longitude]
      : null;

  const savedAddress: SavedAddress | null =
    label.length > 0 ? { label, areaLabel: area || label, position } : null;

  return {
    savedAddress,
    isLoading: query.isLoading,
  };
}
