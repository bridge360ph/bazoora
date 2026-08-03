import { useMemo, useState } from "react";

import {
  SearchableSelect,
  type SearchableSelectOption,
} from "./SearchableSelect";
import { usePhilippineAddressOptions } from "../usePhilippineAddressOptions";

interface PhilippineAddressValue {
  region: string;
  province: string;
  cityMunicipality: string;
  barangay: string;
  postalCode: string;
}

interface PhilippineAddressErrors {
  region?: string;
  province?: string;
  cityMunicipality?: string;
  barangay?: string;
}

interface PhilippineAddressFieldsProps {
  value: PhilippineAddressValue;
  errors?: PhilippineAddressErrors;
  onChange: (value: PhilippineAddressValue) => void;
}

const METRO_MANILA_VALUE = "metro-manila";
const METRO_MANILA_LABEL = "Metro Manila";

function toOptions(
  items: Array<{ code: string; name: string }>,
): SearchableSelectOption[] {
  return items.map((item) => ({
    value: item.code,
    label: item.name,
  }));
}

export function PhilippineAddressFields({
  value,
  errors = {},
  onChange,
}: PhilippineAddressFieldsProps) {
  const [regionCode, setRegionCode] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [localityCode, setLocalityCode] = useState("");
  const [barangayCode, setBarangayCode] = useState("");

  const {
    isNcr,
    regions,
    provinces,
    localities,
    barangays,
    isLoadingRegions,
    isLoadingProvinces,
    isLoadingLocalities,
    isLoadingBarangays,
    hasLocationError,
  } = usePhilippineAddressOptions({
    regionCode,
    provinceCode,
    localityCode,
  });

  const regionOptions = useMemo(() => toOptions(regions), [regions]);

  const provinceOptions = useMemo<SearchableSelectOption[]>(
    () =>
      isNcr
        ? [
            {
              value: METRO_MANILA_VALUE,
              label: METRO_MANILA_LABEL,
            },
          ]
        : toOptions(provinces),
    [isNcr, provinces],
  );

  const localityOptions = useMemo<SearchableSelectOption[]>(
    () =>
      localities
        .filter((locality) => locality.type !== "SubMun")
        .map((locality) => ({
          value: locality.code,
          label: locality.name,
          description:
            locality.type === "City"
              ? "City"
              : locality.type === "Mun"
                ? "Municipality"
                : locality.type,
        })),
    [localities],
  );

  const barangayOptions = useMemo(
    () => toOptions(barangays),
    [barangays],
  );

  function updateValue(
    changes: Partial<PhilippineAddressValue>,
  ) {
    onChange({
      ...value,
      ...changes,
    });
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <SearchableSelect
        label="Region"
        value={regionCode}
        options={regionOptions}
        onChange={(option) => {
          setRegionCode(option.value);
          setProvinceCode("");
          setLocalityCode("");
          setBarangayCode("");

          updateValue({
            region: option.label,
            province: "",
            cityMunicipality: "",
            barangay: "",
            postalCode: "",
          });
        }}
        placeholder="Select a region"
        emptyMessage="No matching regions found."
        error={errors.region}
        required
        loading={isLoadingRegions}
      />

      <SearchableSelect
        label="Province"
        value={isNcr ? METRO_MANILA_VALUE : provinceCode}
        options={provinceOptions}
        onChange={(option) => {
          setProvinceCode(option.value);
          setLocalityCode("");
          setBarangayCode("");

          updateValue({
            province: option.label,
            cityMunicipality: "",
            barangay: "",
            postalCode: "",
          });
        }}
        placeholder={
          regionCode
            ? "Select a province"
            : "Select a region first"
        }
        emptyMessage="No matching provinces found."
        error={errors.province}
        required
        disabled={!regionCode || isNcr}
        loading={isLoadingProvinces}
      />

      <SearchableSelect
        label="City/Municipality"
        value={localityCode}
        options={localityOptions}
        onChange={(option) => {
          const locality = localities.find(
            (item) => item.code === option.value,
          );

          setLocalityCode(option.value);
          setBarangayCode("");

          updateValue({
            province: isNcr
              ? METRO_MANILA_LABEL
              : value.province,
            cityMunicipality: option.label,
            barangay: "",
            postalCode: locality?.zip_code ?? "",
          });
        }}
        placeholder={
          regionCode && (isNcr || provinceCode)
            ? "Select a city or municipality"
            : "Select a province first"
        }
        emptyMessage="No matching cities or municipalities found."
        error={errors.cityMunicipality}
        required
        disabled={!regionCode || (!isNcr && !provinceCode)}
        loading={isLoadingLocalities}
      />

      <SearchableSelect
        label="Barangay"
        value={barangayCode}
        options={barangayOptions}
        onChange={(option) => {
          setBarangayCode(option.value);

          updateValue({
            barangay: option.label,
          });
        }}
        placeholder={
          localityCode
            ? "Select a barangay"
            : "Select a city or municipality first"
        }
        emptyMessage="No matching barangays found."
        error={errors.barangay}
        required
        disabled={!localityCode}
        loading={isLoadingBarangays}
      />

      {hasLocationError && (
        <p
          role="alert"
          className="sm:col-span-2 text-sm text-red-600"
        >
          Philippine location options could not be loaded. Please try again.
        </p>
      )}
    </div>
  );
}