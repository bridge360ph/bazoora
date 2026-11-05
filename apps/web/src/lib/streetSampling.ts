import axios from "axios";
import { z } from "zod";

import { env } from "./env";
import { isInsideArea, type AreaBoundary } from "./area";
import { haversineMeters } from "./branches";

export interface StreetPoint {
  lat: number;
  lng: number;
  /** The street name, or "" for an unnamed road. */
  name: string;
}

const osrm = axios.create({ baseURL: env.NEXT_PUBLIC_OSRM_URL, timeout: 10_000 });

const nearestSchema = z.object({
  code: z.string(),
  waypoints: z
    .array(
      z.object({
        location: z.tuple([z.number(), z.number()]),
        name: z.string().optional(),
        distance: z.number().optional(),
        nodes: z.array(z.number()).optional(),
      }),
    )
    .optional(),
});

// Keeps the number of lookups reasonable for the public routing server.
// About 20 seconds for a large barangay; small ones take a few seconds.
const MAX_LOOKUPS = 260;
const MIN_SPACING_M = 55;
const PARALLEL = 6;
// Snapped points closer than this are the same place.
const MERGE_M = 20;

function metersToDegrees(meters: number, atLat: number): { lat: number; lng: number } {
  return {
    lat: meters / 111_320,
    lng: meters / (111_320 * Math.cos((atLat * Math.PI) / 180)),
  };
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

    if (points.length <= MAX_LOOKUPS || spacing > 2000) return { points, spacing };
    spacing *= 1.15;
  }
}

async function nearestRoad(lat: number, lng: number) {
  const response = await osrm.get<unknown>(`/nearest/v1/driving/${lng},${lat}`, {
    params: { number: 1 },
  });
  const parsed = nearestSchema.parse(response.data);
  return parsed.code === "Ok" ? (parsed.waypoints?.[0] ?? null) : null;
}

/**
 * Points on the roads of an area: a grid is laid over the area and each grid
 * point is moved onto the nearest road by the routing service. With a dense
 * grid every street in the area gets at least one point. Each road segment
 * keeps one point.
 */
export async function sampleStreetPoints(area: AreaBoundary): Promise<StreetPoint[]> {
  const { points: grid, spacing } = gridInside(area);
  const found: StreetPoint[] = [];
  const seenSegments = new Set<string>();

  for (let i = 0; i < grid.length; i += PARALLEL) {
    const batch = grid.slice(i, i + PARALLEL);
    const results = await Promise.allSettled(batch.map(([lat, lng]) => nearestRoad(lat, lng)));

    for (const result of results) {
      if (result.status !== "fulfilled" || !result.value) continue;

      const { location, name = "", distance = 0, nodes = [] } = result.value;
      const point: StreetPoint = { lat: location[1], lng: location[0], name: name.trim() };

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

  return found;
}
