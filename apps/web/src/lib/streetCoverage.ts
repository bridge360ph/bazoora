import type { AreaBoundary } from "./area";
import { haversineMeters, nearestBranches, type Branch } from "./branches";
import { calculateRoute } from "./routing";
import { sampleStreetPoints, type StreetPoint } from "./streetSampling";

export interface CoveragePlan {
  branch: Branch;
  /** The driving path as [lat, lng] points, from the branch through every street. */
  path: [number, number][];
  /** Street points the path passes, in driving order. */
  points: StreetPoint[];
  streetCount: number;
  meters: number;
  seconds: number;
  /** True when part of the path is a straight line because the routing service did not answer. */
  estimated: boolean;
}

// Directions requests take at most this many points (Mapbox allows 25).
const ROUTE_CHUNK = 25;

function pathLength(path: number[], points: { lat: number; lng: number }[]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = points[path[i] ?? 0];
    const b = points[path[i + 1] ?? 0];
    if (a && b) total += haversineMeters(a, b);
  }
  return total;
}

/**
 * Visiting order from the branch (index 0): nearest neighbour, then 2-opt,
 * both on straight-line distance. Street points are close together, so this
 * matches the road distance well enough to order them.
 */
function orderPoints(points: { lat: number; lng: number }[]): number[] {
  const remaining = new Set(points.map((_, index) => index).slice(1));
  const path = [0];

  while (remaining.size > 0) {
    const current = points[path[path.length - 1] ?? 0];
    let best = -1;
    let bestDistance = Infinity;
    for (const index of remaining) {
      const candidate = points[index];
      if (!current || !candidate) continue;
      const distance = haversineMeters(current, candidate);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    }
    remaining.delete(best);
    path.push(best);
  }

  let improved = true;
  let passes = 0;
  while (improved && passes < 30) {
    improved = false;
    passes += 1;
    for (let i = 1; i < path.length - 1; i++) {
      for (let k = i + 1; k < path.length; k++) {
        const a = points[path[i - 1] ?? 0];
        const b = points[path[i] ?? 0];
        const c = points[path[k] ?? 0];
        const d = points[path[k + 1] ?? -1];
        if (!a || !b || !c) continue;
        const before = haversineMeters(a, b) + (d ? haversineMeters(c, d) : 0);
        const after = haversineMeters(a, c) + (d ? haversineMeters(b, d) : 0);
        if (after + 0.5 < before) {
          path.splice(i, k - i + 1, ...path.slice(i, k + 1).reverse());
          improved = true;
        }
      }
    }
  }

  return path;
}

/**
 * A driving path from a branch (the nearest by default) that passes every street of the
 * area: street points are found across the whole area, put in visiting
 * order, and the road path through them is asked from the routing service
 * in chunks.
 */
export async function planStreetCoverage(
  area: AreaBoundary,
  /** Start from this branch, such as the route truck's. Default: the nearest. */
  startBranch?: Branch | null,
): Promise<CoveragePlan | null> {
  const streets = await sampleStreetPoints(area);
  if (streets.length === 0) return null;

  const branch =
    startBranch ?? nearestBranches([{ lat: area.center[0], lng: area.center[1] }], 1)[0];
  if (!branch) return null;

  const nodes = [{ lat: branch.lat, lng: branch.lng }, ...streets];
  const order = orderPoints(nodes);
  const ordered = order.slice(1).flatMap((index) => {
    const point = streets[index - 1];
    return point ? [point] : [];
  });

  const sequence: [number, number][] = [
    [branch.lng, branch.lat],
    ...ordered.map((point) => [point.lng, point.lat] as [number, number]),
  ];

  const path: [number, number][] = [];
  let meters = 0;
  let seconds = 0;
  let estimated = false;

  // Consecutive chunks share their end point so the path is continuous.
  for (let start = 0; start < sequence.length - 1; start += ROUTE_CHUNK - 1) {
    const chunk = sequence.slice(start, start + ROUTE_CHUNK);
    if (chunk.length < 2) break;

    const route = await calculateRoute(chunk);
    if (route.distance <= 0) estimated = true;

    meters += route.distance > 0 ? route.distance : pathLength(
      chunk.map((_, i) => i),
      chunk.map(([lng, lat]) => ({ lat, lng })),
    );
    seconds += route.duration;

    const coordinates = route.geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number],
    );
    path.push(...(path.length > 0 ? coordinates.slice(1) : coordinates));
  }

  return {
    branch,
    path,
    points: ordered,
    streetCount: new Set(ordered.map((point) => point.name).filter(Boolean)).size,
    meters,
    seconds,
    estimated,
  };
}
