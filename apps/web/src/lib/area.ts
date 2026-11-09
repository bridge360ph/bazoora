import { geocodeArea, type AreaResult } from "./geocoding";

type LatLng = [number, number];

/**
 * An area such as a barangay. "boundary" areas have an outline (or a real
 * bounding box) from OpenStreetMap. "approximate" areas only have a centre
 * point, so a radius around it is used and stops outside it are a warning.
 */
export interface AreaBoundary {
  center: LatLng;
  /** [west, south, east, north] */
  viewbox: [number, number, number, number];
  /** Outer rings as [lat, lng] points. Empty when there is no outline. */
  rings: LatLng[][];
  precision: "boundary" | "approximate";
}

const APPROXIMATE_RADIUS_M = 1500;
// A bounding box smaller than this is only a point, not an area.
const MIN_AREA_SPAN_DEG = 0.002;

function toRings(geojson: AreaResult["geojson"]): LatLng[][] {
  if (!geojson) return [];

  const outerRing = (polygon: unknown): LatLng[] => {
    const ring = Array.isArray(polygon) ? (polygon[0] as unknown) : null;
    if (!Array.isArray(ring)) return [];
    return ring.flatMap((point: unknown) =>
      Array.isArray(point) && typeof point[0] === "number" && typeof point[1] === "number"
        ? [[point[1], point[0]] as LatLng]
        : [],
    );
  };

  if (geojson.type === "Polygon") return [outerRing(geojson.coordinates)];
  if (geojson.type === "MultiPolygon" && Array.isArray(geojson.coordinates)) {
    return (geojson.coordinates as unknown[]).map(outerRing).filter((ring) => ring.length > 2);
  }
  return [];
}

function metersBetween([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** Ray casting: is the point inside the ring? */
function insideRing([lat, lng]: LatLng, ring: LatLng[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i] ?? [0, 0];
    const [latJ, lngJ] = ring[j] ?? [0, 0];
    const crosses =
      latI > lat !== latJ > lat &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function isInsideArea(area: AreaBoundary, point: LatLng): boolean {
  if (area.rings.length > 0) {
    return area.rings.some((ring) => insideRing(point, ring));
  }

  if (area.precision === "boundary") {
    const [west, south, east, north] = area.viewbox;
    return point[0] >= south && point[0] <= north && point[1] >= west && point[1] <= east;
  }

  return metersBetween(area.center, point) <= APPROXIMATE_RADIUS_M;
}

// Nominatim asks for at most one request per second.
const LOOKUP_SPACING_MS = 1100;

/**
 * Spellings to try for "Barangay, City". The Philippine address list names
 * cities "City of Makati", which the map search does not find, while
 * "Makati" and "Makati City" work. Notes such as "(Pob.)" are dropped.
 */
function areaQueries(label: string): string[] {
  const [rawBarangay = "", ...rest] = label.split(",");
  const barangay = rawBarangay.replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  const city = rest.join(",").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();

  if (!city) return [`${barangay}, Philippines`];

  const bareCity = city.replace(/^city of\s+/i, "").replace(/\s+city$/i, "").trim();

  return [
    ...new Set([
      `${barangay}, ${bareCity}, Philippines`,
      `${barangay}, ${bareCity} City, Philippines`,
      `${barangay}, ${city}, Philippines`,
    ]),
  ];
}

/** Finds an area by name, for example "San Lorenzo, City of Makati". */
export async function findAreaBoundary(label: string): Promise<AreaBoundary | null> {
  let result: AreaResult | undefined;

  for (const [index, query] of areaQueries(label).entries()) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, LOOKUP_SPACING_MS));
    [result] = await geocodeArea(query);
    if (result) break;
  }

  if (!result) return null;

  const [south, north, west, east] = result.boundingbox as [number, number, number, number];
  const rings = toRings(result.geojson);
  const isPoint = north - south < MIN_AREA_SPAN_DEG && east - west < MIN_AREA_SPAN_DEG;

  if (rings.length === 0 && isPoint) {
    // About 1.5 km around the centre.
    const pad = APPROXIMATE_RADIUS_M / 111_000;
    return {
      center: [result.lat, result.lon],
      viewbox: [result.lon - pad, result.lat - pad, result.lon + pad, result.lat + pad],
      rings: [],
      precision: "approximate",
    };
  }

  return {
    center: [result.lat, result.lon],
    viewbox: [west, south, east, north],
    rings,
    precision: "boundary",
  };
}
