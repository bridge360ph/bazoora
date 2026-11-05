import { calculateMatrix } from "./routing";
import { haversineMeters, nearestBranches, type Branch } from "./branches";

export interface OptimizerPoint {
  lat: number;
  lng: number;
}

export interface RoutePlan {
  /** The branch the truck starts from. */
  branch: Branch;
  /** Indexes into the stops passed in, in visiting order. */
  order: number[];
  /** The stops in their current order, driven from the chosen branch. */
  before: { seconds: number; meters: number };
  /** The planned order from the chosen branch. */
  after: { seconds: number; meters: number };
  /** How many nearby branches were compared. */
  branchesCompared: number;
  /** True when the routing service was unavailable and straight-line estimates were used. */
  estimated: boolean;
}

// Used to turn straight-line distance into rough driving figures when the
// routing service gives no answer for a pair of points.
const ROAD_FACTOR = 1.3;
const AVERAGE_SPEED_MPS = 25_000 / 3600; // about 25 km/h in town
// Nearby branches compared by real driving time.
const CANDIDATE_BRANCHES = 3;

/** Total of an open path over a cost matrix. */
function pathCost(path: number[], cost: number[][]): number {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += cost[path[i] ?? 0]?.[path[i + 1] ?? 0] ?? 0;
  }
  return total;
}

/**
 * Shortest open path from `start` through every node in `nodes`, using
 * nearest neighbour (drive to the closest unvisited stop next) and then 2-opt
 * (reverse any stretch that makes the path shorter, until nothing improves).
 */
function solveOpenPath(start: number, nodes: number[], seconds: number[][]): number[] {
  const remaining = new Set(nodes);
  const path = [start];

  while (remaining.size > 0) {
    const current = path[path.length - 1] ?? start;
    let best = -1;
    let bestCost = Infinity;

    for (const node of remaining) {
      const cost = seconds[current]?.[node] ?? Infinity;
      if (cost < bestCost) {
        best = node;
        bestCost = cost;
      }
    }

    remaining.delete(best);
    path.push(best);
  }

  let improved = true;
  let guard = 0;

  while (improved && guard < 1000) {
    improved = false;
    guard += 1;

    for (let i = 1; i < path.length - 1; i++) {
      for (let k = i + 1; k < path.length; k++) {
        const candidate = [
          ...path.slice(0, i),
          ...path.slice(i, k + 1).reverse(),
          ...path.slice(k + 1),
        ];

        if (pathCost(candidate, seconds) + 1e-6 < pathCost(path, seconds)) {
          path.splice(0, path.length, ...candidate);
          improved = true;
        }
      }
    }
  }

  return path;
}

/**
 * Plans a route from the best nearby branch. The closest branches in a
 * straight line are compared by real driving time, and the one that gives
 * the shortest drive through all stops is chosen.
 *
 * With `keepOrder` the stops stay in their order (the resident asked for
 * it) and only the starting branch is chosen.
 */
export async function planRoute(
  stops: OptimizerPoint[],
  options: { keepOrder?: boolean } = {},
): Promise<RoutePlan | null> {
  if (stops.length === 0) return null;

  const branches = nearestBranches(stops, CANDIDATE_BRANCHES);
  const points: OptimizerPoint[] = [...branches, ...stops];
  const branchCount = branches.length;
  const n = points.length;

  let estimated = false;
  let durations: (number | null)[][] = [];
  let distances: (number | null)[][] | undefined;

  try {
    const matrix = await calculateMatrix(points.map((p) => [p.lng, p.lat] as [number, number]));
    durations = matrix.durations;
    distances = matrix.distances;
  } catch {
    estimated = true;
  }

  const seconds: number[][] = [];
  const meters: number[][] = [];

  for (let i = 0; i < n; i++) {
    const secondsRow: number[] = [];
    const metersRow: number[] = [];

    for (let j = 0; j < n; j++) {
      const from = points[i];
      const to = points[j];
      const fallbackMeters = from && to ? haversineMeters(from, to) * ROAD_FACTOR : 0;
      const routedSeconds = durations[i]?.[j];
      const routedMeters = distances?.[i]?.[j];

      if (i !== j && (routedSeconds === null || routedSeconds === undefined)) {
        estimated = true;
      }

      secondsRow.push(routedSeconds ?? fallbackMeters / AVERAGE_SPEED_MPS);
      metersRow.push(routedMeters ?? fallbackMeters);
    }

    seconds.push(secondsRow);
    meters.push(metersRow);
  }

  const stopNodes = stops.map((_, index) => branchCount + index);
  let best: { branchIndex: number; path: number[]; cost: number } | null = null;

  for (let branchIndex = 0; branchIndex < branchCount; branchIndex++) {
    const original = [branchIndex, ...stopNodes];
    let path = options.keepOrder ? original : solveOpenPath(branchIndex, stopNodes, seconds);

    // Keep the current order if it is already at least as good.
    if (pathCost(path, seconds) >= pathCost(original, seconds)) path = original;

    const cost = pathCost(path, seconds);
    if (!best || cost < best.cost) best = { branchIndex, path, cost };
  }

  if (!best) return null;

  const branch = branches[best.branchIndex];
  if (!branch) return null;

  const original = [best.branchIndex, ...stopNodes];

  return {
    branch,
    order: best.path.slice(1).map((node) => node - branchCount),
    before: { seconds: pathCost(original, seconds), meters: pathCost(original, meters) },
    after: { seconds: pathCost(best.path, seconds), meters: pathCost(best.path, meters) },
    branchesCompared: branchCount,
    estimated,
  };
}
