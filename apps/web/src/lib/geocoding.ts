import axios from "axios";
import { z } from "zod";

import { env } from "@/lib/env";

/**
 * Nominatim client — OpenStreetMap's public geocoding service. Free, no API
 * key, but subject to their usage policy (max 1 req/sec, descriptive User-Agent
 * required for server-side use).
 *
 * For development / low traffic this can be called directly from the browser.
 * For production we should proxy through bazoora-api so we can:
 *   - Set a proper `User-Agent` header (browsers block overriding it).
 *   - Cache responses and stay under Nominatim's rate limits.
 *   - Swap to a self-hosted Nominatim or a commercial provider without touching
 *     every call site.
 *
 * Docs: https://nominatim.org/release-docs/develop/api/Overview/
 */

const nominatim = axios.create({
  baseURL: env.NEXT_PUBLIC_NOMINATIM_URL,
  timeout: 10_000,
});

const searchResultSchema = z.object({
  place_id: z.number(),
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  display_name: z.string(),
  type: z.string().optional(),
  class: z.string().optional(),
  importance: z.number().optional(),
  boundingbox: z.array(z.string()).length(4).optional(),
});

const reverseResultSchema = z.object({
  place_id: z.number().optional(),
  lat: z.coerce.number().optional(),
  lon: z.coerce.number().optional(),
  display_name: z.string().optional(),
  address: z.record(z.string(), z.string()).optional(),
});

export type GeocodeResult = z.infer<typeof searchResultSchema>;
export type ReverseGeocodeResult = z.infer<typeof reverseResultSchema>;

export interface GeocodeOptions {
  limit?: number;
  /** ISO-3166 country code filter, e.g. "ph" for the Philippines. */
  countryCodes?: string;
  /** [west, south, east, north]. Results inside it are preferred. */
  viewbox?: [number, number, number, number];
  /** With a viewbox, only return results inside it. */
  bounded?: boolean;
}

export async function geocode(
  query: string,
  options: GeocodeOptions = {},
): Promise<GeocodeResult[]> {
  const response = await nominatim.get<unknown>("/search", {
    params: {
      q: query,
      format: "json",
      addressdetails: 0,
      limit: options.limit ?? 5,
      ...(options.countryCodes && { countrycodes: options.countryCodes }),
      ...(options.viewbox && { viewbox: options.viewbox.join(",") }),
      ...(options.viewbox && options.bounded && { bounded: 1 }),
    },
  });
  return z.array(searchResultSchema).parse(response.data);
}

const areaResultSchema = z.object({
  class: z.string().optional(),
  type: z.string().optional(),
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  boundingbox: z.array(z.coerce.number()).length(4),
  geojson: z
    .object({
      type: z.string(),
      coordinates: z.unknown(),
    })
    .optional(),
});

export type AreaResult = z.infer<typeof areaResultSchema>;

/**
 * Looks up an area such as a barangay with its outline when OpenStreetMap
 * has one. Results with an outline come first.
 */
export async function geocodeArea(query: string): Promise<AreaResult[]> {
  const response = await nominatim.get<unknown>("/search", {
    params: {
      q: query,
      format: "json",
      polygon_geojson: 1,
      limit: 3,
      countrycodes: "ph",
    },
  });
  const results = z.array(areaResultSchema).parse(response.data);
  const hasOutline = (result: AreaResult) =>
    result.geojson?.type === "Polygon" || result.geojson?.type === "MultiPolygon";
  // Administrative boundaries (barangays, cities) first, then other outlines.
  const rank = (result: AreaResult) =>
    (result.class === "boundary" && result.type === "administrative" ? 0 : 2) +
    (hasOutline(result) ? 0 : 1);

  return [...results].sort((a, b) => rank(a) - rank(b));
}

/**
 * Reverse geocode: turn coordinates into a formatted address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const response = await nominatim.get<unknown>("/reverse", {
    params: {
      lat,
      lon: lng,
      format: "json",
      addressdetails: 1,
    },
  });
  return reverseResultSchema.parse(response.data);
}
