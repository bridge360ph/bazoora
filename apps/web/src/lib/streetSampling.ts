import { apiClient } from "./api-client";
import { isInsideArea, type AreaBoundary } from "./area";
import { haversineMeters } from "./branches";

export interface StreetPoint {
  lat: number;
  lng: number;
  /** The street name, or "" for an unnamed road. */
  name: string;
}

export interface StreetSample {
  points: StreetPoint[];
  /** Grid points the routing server did not answer for. Their streets may be missing. */
  skipped: number;
}

/** The API's answer per point: a road, null (no road nearby) or "failed". */
type NearestAnswer =
  | { lat: number; lng: number; name: string; distance: number; nodes: number[] }
  | null
  | "failed";

// Lookups go through the API, which rate limits and caches them. The cap is
// applied after the grid is built, so a large area never asks for more.
const MAX_LOOKUPS = 200;
const MIN_SPACING_M = 55;
const MAX_SPACING_M = 2000;
// Points per API request (the API accepts up to 40).
const CHUNK = 40;
// Snapped points closer than this are the same place.
const MERGE_M = 20;

function metersToDegrees(meters: number, atLat: number): { lat: number; lng: number } {
  return {
    lat: meters / 111_320,
    lng: meters / (111_320 * Math.cos((atLat * Math.PI) / 180)),
  };
}

/** Every n-th point, so at most `max` remain, spread over the whole list. */
function thinOut<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const step = items.length / max;
  return Array.from({ length: max }, (_, index) => items[Math.floor(index * step)] as T);
}

/** A grid of points inside the area, spaced so there are at most MAX_LOOKUPS. */
function gridInside(area: AreaBoundary): { points: [number, number][]; spacing: number } {
  const [west, south, east, north] = area.viewbox;
  let spacing = MIN_SPACING_M;

  for (;;) {
    const step = metersToDegrees(spacing, (south + north) / 2);
    const points: [number, number][] = [];

    for (let lat = south + step.lat / 2; lat < north; lat += step.lat) {
      for (let lng = west + step.lng / 2; lng < east; lng += step.lng) {
        if (isInsideArea(area, [lat, lng])) points.push([lat, lng]);
      }
    }

    // A very large area (for example a whole city) still stops at the cap.
    if (points.length <= MAX_LOOKUPS || spacing > MAX_SPACING_M) {
      return { points: thinOut(points, MAX_LOOKUPS), spacing };
    }
    spacing *= 1.15;
  }
}

async function nearestRoads(points: [number, number][]): Promise<NearestAnswer[]> {
  try {
    const { data } = await apiClient.post<{ success: boolean; data: NearestAnswer[] }>(
      "/routing/nearest",
      { points: points.map(([lat, lng]) => ({ lat, lng })) },
    );
    return data.data;
  } catch {
    return points.map(() => "failed" as const);
  }
}

/**
 * Points on the roads of an area: a grid is laid over the area and each grid
 * point is moved onto the nearest road by the routing service, through the
 * API. With a dense grid every street in the area gets at least one point.
 * Each road segment keeps one point. Lookups the routing server did not
 * answer are counted in `skipped` instead of being dropped silently.
 */
export async function sampleStreetPoints(area: AreaBoundary): Promise<StreetSample> {
  const { points: grid, spacing } = gridInside(area);
  const found: StreetPoint[] = [];
  const seenSegments = new Set<string>();
  let skipped = 0;

  for (let i = 0; i < grid.length; i += CHUNK) {
    const answers = await nearestRoads(grid.slice(i, i + CHUNK));

    for (const answer of answers) {
      if (answer === "failed") {
        skipped += 1;
        continue;
      }
      if (!answer) continue;

      const { distance, nodes } = answer;
      const point: StreetPoint = { lat: answer.lat, lng: answer.lng, name: answer.name };

      // Too far from the grid point means no road nearby; outside means a
      // road of the next barangay.
      if (distance > spacing || !isInsideArea(area, [point.lat, point.lng])) continue;

      const segment = [...nodes].sort((a, b) => a - b).join("-");
      if (segment && seenSegments.has(segment)) continue;
      if (found.some((other) => haversineMeters(other, point) < MERGE_M)) continue;

      if (segment) seenSegments.add(segment);
      found.push(point);
    }
  }

  return { points: found, skipped };
}
