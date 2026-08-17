/**
 * Returns the distance between two coordinates in meters.
 * Uses the Haversine formula with high precision.
 */
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Mean Earth radius in meters
  const R = 6371008.8;

  const toRadians = (degrees: number) =>
    degrees * (Math.PI / 180);

  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);

  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2;

  // Protect against floating-point errors
  const c = 2 * Math.atan2(
    Math.sqrt(Math.min(1, a)),
    Math.sqrt(Math.max(0, 1 - a))
  );

  return R * c;
}