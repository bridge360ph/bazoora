import { z } from "zod";

import { apiClient } from "@/lib/api-client";

const locationOptionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});

const localitySchema = locationOptionSchema.extend({
  type: z.string().min(1),
  zip_code: z.string().default(""),
  district: z.string().optional(),
});

const barangaySchema = locationOptionSchema.extend({
  status: z.string().optional(),
});

const locationOptionsSchema = z.array(locationOptionSchema);
const localitiesSchema = z.array(localitySchema);
const barangaysSchema = z.array(barangaySchema);

export type LocationOption = z.infer<typeof locationOptionSchema>;
export type PhilippineLocality = z.infer<typeof localitySchema>;
export type PhilippineBarangay = z.infer<typeof barangaySchema>;

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((first, second) =>
    first.name.localeCompare(second.name, "en", {
      sensitivity: "base",
    }),
  );
}

export async function fetchRegions(): Promise<LocationOption[]> {
  const response = await apiClient.get<unknown>("/locations/regions");

  return sortByName(locationOptionsSchema.parse(response.data));
}

export async function fetchProvinces(
  regionCode: string,
): Promise<LocationOption[]> {
  const response = await apiClient.get<unknown>(
    `/locations/regions/${encodeURIComponent(regionCode)}/provinces`,
  );

  return sortByName(locationOptionsSchema.parse(response.data));
}

export async function fetchLocalitiesByRegion(
  regionCode: string,
): Promise<PhilippineLocality[]> {
  const response = await apiClient.get<unknown>(
    `/locations/regions/${encodeURIComponent(regionCode)}/localities`,
  );

  return sortByName(localitiesSchema.parse(response.data));
}

export async function fetchLocalitiesByProvince(
  provinceCode: string,
): Promise<PhilippineLocality[]> {
  const response = await apiClient.get<unknown>(
    `/locations/provinces/${encodeURIComponent(provinceCode)}/localities`,
  );

  return sortByName(localitiesSchema.parse(response.data));
}

export async function fetchBarangays(
  localityCode: string,
): Promise<PhilippineBarangay[]> {
  const response = await apiClient.get<unknown>(
    `/locations/localities/${encodeURIComponent(localityCode)}/barangays`,
  );

  return sortByName(barangaysSchema.parse(response.data));
}