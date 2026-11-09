/**
 * Snaps points onto the nearest road with OSRM /nearest, for the street
 * sampler that builds a barangay's collection points.
 *
 * Lookups go through the API instead of the browser so every admin shares
 * one rate limit and one cache. OSRM_URL points at the routing server
 * (default: the public demo, which allows only light use; self-host OSRM for
 * production). OSRM_MAX_REQUESTS_PER_SECOND caps the rate (default 5).
 */

export interface NearestRoad {
  lat: number;
  lng: number;
  /** The street name, or "" for an unnamed road. */
  name: string;
  /** Meters from the asked point to the road. */
  distance: number;
  /** OSRM node ids of the road segment, used to drop duplicates. */
  nodes: number[];
}

/** null: no road near the point. "failed": the routing server did not answer. */
export type NearestResult = NearestRoad | null | "failed";

const OSRM_URL = (process.env.OSRM_URL?.trim() || "https://router.project-osrm.org").replace(
  /\/+$/,
  "",
);
const MAX_PER_SECOND = Math.max(1, Number(process.env.OSRM_MAX_REQUESTS_PER_SECOND) || 5);
const MIN_GAP_MS = Math.ceil(1000 / MAX_PER_SECOND);
const TIMEOUT_MS = 10_000;

// Snapped roads do not move, so answers are kept for a long time. Points are
// rounded to about 1 m so the same grid point hits the cache.
const CACHE_MAX_ENTRIES = 20_000;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const cache = new Map<string, { value: NearestRoad | null; storedAt: number }>();

function cacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function readCache(key: string): NearestRoad | null | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.storedAt > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function writeCache(key: string, value: NearestRoad | null): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // Map keeps insertion order, so the first key is the oldest.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { value, storedAt: Date.now() });
}

// One shared queue for every request, so the routing server never sees more
// than MAX_PER_SECOND calls from this API.
let nextSlot = 0;

async function waitForSlot(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + MIN_GAP_MS;
  if (slot > now) {
    await new Promise<void>((resolve) => setTimeout(resolve, slot - now));
  }
}

interface OsrmNearestResponse {
  code?: string;
  waypoints?: {
    location?: [number, number];
    name?: string;
    distance?: number;
    nodes?: number[];
  }[];
}

async function askOsrm(lat: number, lng: number): Promise<NearestRoad | null> {
  await waitForSlot();

  const response = await fetch(`${OSRM_URL}/nearest/v1/driving/${lng},${lat}?number=1`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`OSRM answered ${response.status}`);
  }

  const body = (await response.json()) as OsrmNearestResponse;
  const waypoint = body.code === "Ok" ? body.waypoints?.[0] : undefined;

  if (!waypoint?.location) {
    return null;
  }

  return {
    lat: waypoint.location[1],
    lng: waypoint.location[0],
    name: (waypoint.name ?? "").trim(),
    distance: waypoint.distance ?? 0,
    nodes: waypoint.nodes ?? [],
  };
}

/** The nearest road for each point, in order. Cached points need no request. */
export async function findNearestRoads(
  points: readonly { lat: number; lng: number }[],
): Promise<NearestResult[]> {
  const results: NearestResult[] = [];

  for (const point of points) {
    const key = cacheKey(point.lat, point.lng);
    const cached = readCache(key);

    if (cached !== undefined) {
      results.push(cached);
      continue;
    }

    try {
      const road = await askOsrm(point.lat, point.lng);
      writeCache(key, road);
      results.push(road);
    } catch {
      // Not cached, so the next attempt asks again.
      results.push("failed");
    }
  }

  return results;
}
