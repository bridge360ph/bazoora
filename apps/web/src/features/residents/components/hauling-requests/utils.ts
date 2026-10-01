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
