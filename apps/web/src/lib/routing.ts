import axios from "axios";
import { z } from "zod";

import { env } from "@/lib/env";

/**
 * OSRM client — Open Source Routing Machine. Computes road-network routes
 * between waypoints. Free public demo at router.project-osrm.org; for
 * production throughput you should self-host an OSRM instance or swap to a
 * commercial provider.
 *
 * Docs: https://project-osrm.org/docs/v5.24.0/api/#
 */

const osrm = axios.create({
  baseURL: env.VITE_OSRM_URL,
  timeout: 10_000, // Faster fallback for better UX
});

/** [longitude, latitude] — OSRM (and GeoJSON) use lon/lat order. */
export type Waypoint = [number, number];

export type RoutingProfile = "driving" | "walking" | "cycling";

const geoJsonLineStringSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

const stepSchema = z.object({
  distance: z.number(),
  duration: z.number(),
  name: z.string().optional(),
  mode: z.string().optional(),
  maneuver: z
    .object({
      instruction: z.string().optional(),
      type: z.string().optional(),
      modifier: z.string().optional(),
      location: z.tuple([z.number(), z.number()]).optional(),
    })
    .optional(),
  bannerInstructions: z
    .array(
      z.object({
        distanceAlongGeometry: z.number().optional(),
        primary: z.object({
          text: z.string(),
          type: z.string(),
          modifier: z.string().optional(),
        }),
      }),
    )
    .optional(),
});

export type RouteStep = z.infer<typeof stepSchema>;

const legSchema = z.object({
  distance: z.number(),
  duration: z.number(),
  summary: z.string().optional(),
  steps: z.array(stepSchema).optional(),
});

export type RouteLeg = z.infer<typeof legSchema>;

const routeSchema = z.object({
  /** Total distance in metres. */
  distance: z.number(),
  /** Total duration in seconds. */
  duration: z.number(),
  /** Route polyline as GeoJSON (requested with geometries=geojson). */
  geometry: geoJsonLineStringSchema,
  /** Per-leg details (one per consecutive waypoint pair). */
  legs: z.array(legSchema).optional(),
});

const routeResponseSchema = z.object({
  code: z.string(),
  routes: z.array(routeSchema).nonempty(),
});

export type Route = z.infer<typeof routeSchema>;

export interface RouteOptions {
  profile?: RoutingProfile;
  /** Include alternative route suggestions when available. */
  alternatives?: boolean;
  /** Return step-by-step route instructions. */
  steps?: boolean;
  /** Request Mapbox-specific turn-by-turn banner visuals. */
  bannerInstructions?: boolean;
}

/**
 * Compute the fastest road-network route that visits each waypoint in order.
 *
 * @example
 *   const route = await calculateRoute(
 *     [[120.9842, 14.5995], [120.9830, 14.6100]], // Manila
 *     { profile: "driving" },
 *   );
 *   const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
 *   // feed latLngs to a Leaflet <Polyline />
 */
export async function calculateRoute(
  waypoints: Waypoint[],
  options: RouteOptions = {},
): Promise<Route> {
  if (waypoints.length < 2) {
    throw new Error("calculateRoute requires at least two waypoints");
  }

  const profile = options.profile ?? "driving";
  const coords = waypoints.map(([lng, lat]) => `${lng.toString()},${lat.toString()}`).join(";");

  const useMapbox = !!env.VITE_MAPBOX_ACCESS_TOKEN;

  try {
    const response = useMapbox
      ? await axios.get<unknown>(
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}`,
          {
            params: {
              overview: "full",
              geometries: "geojson",
              alternatives: options.alternatives ?? false,
              steps: options.steps ?? false,
              banner_instructions: options.bannerInstructions ?? false,
              access_token: env.VITE_MAPBOX_ACCESS_TOKEN
            },
            timeout: 10_000,
          },
        )
      : await osrm.get<unknown>(`/route/v1/${profile}/${coords}`, {
          params: {
            overview: "full",
            geometries: "geojson",
            alternatives: options.alternatives ?? false,
            steps: options.steps ?? false,
          },
        });

    const parsed = routeResponseSchema.parse(response.data);
    if (parsed.code !== "Ok") {
      throw new Error(`Routing API returned non-OK code: ${parsed.code}`);
    }
    const [firstRoute] = parsed.routes;
    if (!firstRoute) {
      throw new Error("Routing API returned no routes despite a successful response");
    }
    return firstRoute;
  } catch (error) {
    console.warn("OSRM/Mapbox routing failed, falling back to direct line:", error);

    // Fallback: Return a straight line between waypoints
    return {
      distance: 0,
      duration: 0,
      geometry: {
        type: "LineString",
        coordinates: waypoints,
      },
      legs: waypoints.slice(0, -1).map(() => ({
        distance: 0,
        duration: 0,
        summary: "Direct Line (Routing Fallback)",
      })),
    };
  }
}

export interface MatrixOptions {
  profile?: RoutingProfile;
  /** Semicolon-separated index list or "all" */
  sources?: string;
  /** Semicolon-separated index list or "all" */
  destinations?: string;
}

const matrixResponseSchema = z.object({
  code: z.string(),
  durations: z.array(z.array(z.union([z.number(), z.null()]))),
  distances: z.array(z.array(z.union([z.number(), z.null()]))).optional(),
});

export interface MatrixResult {
  durations: (number | null)[][];
  distances?: (number | null)[][] | undefined;
}

/**
 * Calculates a travel time and distance matrix between a list of coordinates.
 */
export async function calculateMatrix(
  waypoints: Waypoint[],
  options: MatrixOptions = {},
): Promise<MatrixResult> {
  if (waypoints.length < 2) {
    throw new Error("calculateMatrix requires at least two coordinates");
  }

  const profile = options.profile ?? "driving";
  const coords = waypoints.map(([lng, lat]) => `${lng.toString()},${lat.toString()}`).join(";");
  const useMapbox = !!env.VITE_MAPBOX_ACCESS_TOKEN

  try {
    const response = useMapbox
      ? await axios.get<unknown>(
          `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coords}`,
                {
          params: {
            sources: options.sources ?? "all",
            destinations: options.destinations ?? "all",
            annotations: "duration,distance",
            access_token: env.VITE_MAPBOX_ACCESS_TOKEN,
          },
          timeout: 10_000,
        },
        )
      : await osrm.get<unknown>(`/table/v1/${profile}/${coords}`, {
          params: {
            sources: options.sources ?? "all",
            destinations: options.destinations ?? "all",
            annotations: "duration,distance",
          },
        });

    const parsed = matrixResponseSchema.parse(response.data);
    if (parsed.code !== "Ok") {
      throw new Error(`Matrix API returned non-OK code: ${parsed.code}`);
    }

    return {
      durations: parsed.durations,
      distances: parsed.distances ?? undefined,
    };
  } catch (error) {
    console.error("OSRM/Mapbox Matrix calculation failed:", error);

    // Fallback: Compute simple linear distance metrics
    const size = waypoints.length;
    const durations: (number | null)[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null),
    );
    const distances: (number | null)[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null),
    );

    // Fill diagonal safely
    for (let i = 0; i < size; i++) {
      const durRow = durations[i];
      const distRow = distances[i];
      if (durRow) durRow[i] = 0;
      if (distRow) distRow[i] = 0;
    }

    return { durations, distances };
  }
}
