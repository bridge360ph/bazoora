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
    },
  });
  return z.array(searchResultSchema).parse(response.data);
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
