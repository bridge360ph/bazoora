import type { AreaBoundary } from "./area";
import { haversineMeters } from "./branches";
import { planRoute } from "./routeOptimizer";
import { sampleStreetPoints } from "./streetSampling";

export interface GeneratedStop {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

// Collection points closer than this are merged into one.
const MIN_SPACING_M = 180;
const MAX_STOPS = 25;

/**
 * Keeps points at least MIN_SPACING_M apart, spread over the whole area.
 * Farthest-point sampling: start anywhere, then keep adding the point that is
 * farthest from the ones already kept.
 */
function spreadOut(points: GeneratedStop[]): GeneratedStop[] {
  const first = points[0];
  if (!first) return [];

  const kept: GeneratedStop[] = [first];
  const remaining = points.slice(1);

  while (kept.length < MAX_STOPS && remaining.length > 0) {
    let bestIndex = -1;
    let bestDistance = 0;

    remaining.forEach((point, index) => {
      const nearest = Math.min(...kept.map((stop) => haversineMeters(stop, point)));
      if (nearest > bestDistance) {
        bestDistance = nearest;
        bestIndex = index;
      }
    });

    if (bestIndex === -1 || bestDistance < MIN_SPACING_M) break;

    const [next] = remaining.splice(bestIndex, 1);
    if (next) kept.push(next);
  }

  return kept;
}

/** "Rizal Street", "Rizal Street (2)", ... so every stop has its own name. */
function numberRepeatedNames(stops: GeneratedStop[]): GeneratedStop[] {
  const seen = new Map<string, number>();
  return stops.map((stop) => {
    const count = (seen.get(stop.name) ?? 0) + 1;
    seen.set(stop.name, count);
    return count === 1 ? stop : { ...stop, name: `${stop.name} (${count})` };
  });
}

export interface GeneratedRoute {
  stops: GeneratedStop[];
  /** "streets" when built from the barangay's streets, "center" when only its centre was available. */
  source: "streets" | "center";
  branchName: string | null;
}

/**
 * Builds the collection points of a weekly route from its barangay: points
 * on its streets, spread out evenly, in the shortest driving order from the
 * nearest branch. Falls back to the barangay centre when no street is found.
 */
export async function generateBarangayStops(
  area: AreaBoundary,
  barangayLabel: string,
): Promise<GeneratedRoute> {
  const barangayName = barangayLabel.split(",")[0]?.trim() || barangayLabel;
  let streetPoints: Awaited<ReturnType<typeof sampleStreetPoints>>;

  try {
    streetPoints = await sampleStreetPoints(area);
  } catch {
    streetPoints = [];
  }

  // Named streets first, so collection points carry street names.
  const named = streetPoints.filter((point) => point.name);
  const candidates: GeneratedStop[] = (named.length > 0 ? named : streetPoints).map((point) => ({
    name: point.name || `${barangayName} street`,
    address: point.name ? `${point.name}, ${barangayLabel}` : barangayLabel,
    lat: point.lat,
    lng: point.lng,
  }));

  const stops = numberRepeatedNames(spreadOut(candidates));

  if (stops.length === 0) {
    return {
      stops: [
        {
          name: `${barangayName} centre`,
          address: barangayLabel,
          lat: area.center[0],
          lng: area.center[1],
        },
      ],
      source: "center",
      branchName: null,
    };
  }

  const plan = await planRoute(stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })));
  const ordered = plan
    ? plan.order.flatMap((index) => {
        const stop = stops[index];
        return stop ? [stop] : [];
      })
    : stops;

  return { stops: ordered, source: "streets", branchName: plan?.branch.name ?? null };
}
