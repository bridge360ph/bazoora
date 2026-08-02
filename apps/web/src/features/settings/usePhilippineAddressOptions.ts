import { useQuery } from "@tanstack/react-query";

import {
  fetchBarangays,
  fetchLocalitiesByProvince,
  fetchLocalitiesByRegion,
  fetchProvinces,
  fetchRegions,
} from "./location-api";

const NCR_REGION_CODE = "1300000000";

interface UsePhilippineAddressOptionsParams {
  regionCode: string;
  provinceCode: string;
  localityCode: string;
}

export function usePhilippineAddressOptions({
  regionCode,
  provinceCode,
  localityCode,
}: UsePhilippineAddressOptionsParams) {
  const isNcr = regionCode === NCR_REGION_CODE;

  const regionsQuery = useQuery({
    queryKey: ["philippine-locations", "regions"],
    queryFn: fetchRegions,
    staleTime: 60 * 60 * 1000,
  });

  const provincesQuery = useQuery({
    queryKey: ["philippine-locations", "provinces", regionCode],
    queryFn: () => fetchProvinces(regionCode),
    enabled: Boolean(regionCode) && !isNcr,
    staleTime: 60 * 60 * 1000,
  });

  const localitiesQuery = useQuery({
    queryKey: [
      "philippine-locations",
      "localities",
      isNcr ? "region" : "province",
      isNcr ? regionCode : provinceCode,
    ],
    queryFn: () =>
      isNcr
        ? fetchLocalitiesByRegion(regionCode)
        : fetchLocalitiesByProvince(provinceCode),
    enabled:
      Boolean(regionCode) &&
      (isNcr || Boolean(provinceCode)),
    staleTime: 60 * 60 * 1000,
  });

  const barangaysQuery = useQuery({
    queryKey: ["philippine-locations", "barangays", localityCode],
    queryFn: () => fetchBarangays(localityCode),
    enabled: Boolean(localityCode),
    staleTime: 60 * 60 * 1000,
  });

  return {
    isNcr,
    regions: regionsQuery.data ?? [],
    provinces: provincesQuery.data ?? [],
    localities: localitiesQuery.data ?? [],
    barangays: barangaysQuery.data ?? [],
    isLoadingRegions: regionsQuery.isLoading,
    isLoadingProvinces: provincesQuery.isLoading,
    isLoadingLocalities: localitiesQuery.isLoading,
    isLoadingBarangays: barangaysQuery.isLoading,
    hasLocationError:
      regionsQuery.isError ||
      provincesQuery.isError ||
      localitiesQuery.isError ||
      barangaysQuery.isError,
  };
}