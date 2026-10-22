export type { HaulingWasteType as WasteType } from "@bazoora/shared";

export type RequestTab = "new" | "history";

export type LatLng = [number, number];

export type PickupAddress = {
  id: string;
  address: string;
  position: LatLng | null;
};
