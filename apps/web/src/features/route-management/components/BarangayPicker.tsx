import { useMemo, useState, type ReactNode } from "react";

import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/features/settings/components/SearchableSelect";
import { usePhilippineAddressOptions } from "@/features/settings/usePhilippineAddressOptions";

// Bridge360 is in Makati, so Metro Manila is picked first.
const NCR_REGION_CODE = "1300000000";

function toOptions(items: { code: string; name: string }[]): SearchableSelectOption[] {
  return items.map((item) => ({ value: item.code, label: item.name }));
}

interface BarangayPickerProps {
  /** The saved "Barangay, City" label, or "" for a new route. */
  value: string;
  onChange: (label: string) => void;
}

/**
 * Picks the barangay a weekly route covers, from the Philippine address
 * list: region, province (outside Metro Manila), city or municipality, then
 * barangay. Saves it as "Barangay, City".
 */
export function BarangayPicker({ value, onChange }: BarangayPickerProps): ReactNode {
  const [regionCode, setRegionCode] = useState(NCR_REGION_CODE);
  const [provinceCode, setProvinceCode] = useState("");
  const [localityCode, setLocalityCode] = useState("");
  const [localityName, setLocalityName] = useState("");
  const [barangayCode, setBarangayCode] = useState("");
  const [isChanging, setIsChanging] = useState(value === "");

  const options = usePhilippineAddressOptions({ regionCode, provinceCode, localityCode });

  const regionOptions = useMemo(() => toOptions(options.regions), [options.regions]);
  const provinceOptions = useMemo(() => toOptions(options.provinces), [options.provinces]);
  const localityOptions = useMemo(
    () =>
      options.localities
        .filter((locality) => locality.type !== "SubMun")
        .map((locality) => ({ value: locality.code, label: locality.name })),
    [options.localities],
  );
  const barangayOptions = useMemo(() => toOptions(options.barangays), [options.barangays]);

  if (!isChanging) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-gray-300 px-3 py-2">
        <span className="text-sm text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => setIsChanging(true)}
          className="cursor-pointer text-xs font-semibold text-brand hover:underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <SearchableSelect
        label="Region"
        value={regionCode}
        options={regionOptions}
        loading={options.isLoadingRegions}
        onChange={(option) => {
          setRegionCode(option.value);
          setProvinceCode("");
          setLocalityCode("");
          setBarangayCode("");
        }}
      />

      {!options.isNcr && (
        <SearchableSelect
          label="Province"
          value={provinceCode}
          options={provinceOptions}
          loading={options.isLoadingProvinces}
          disabled={!regionCode}
          onChange={(option) => {
            setProvinceCode(option.value);
            setLocalityCode("");
            setBarangayCode("");
          }}
        />
      )}

      <SearchableSelect
        label="City / Municipality"
        value={localityCode}
        options={localityOptions}
        loading={options.isLoadingLocalities}
        disabled={!regionCode || (!options.isNcr && !provinceCode)}
        onChange={(option) => {
          setLocalityCode(option.value);
          setLocalityName(option.label);
          setBarangayCode("");
        }}
      />

      <SearchableSelect
        label="Barangay"
        required
        value={barangayCode}
        options={barangayOptions}
        loading={options.isLoadingBarangays}
        disabled={!localityCode}
        onChange={(option) => {
          setBarangayCode(option.value);
          onChange(`${option.label}, ${localityName}`);
        }}
      />

      {options.hasLocationError && (
        <p className="col-span-2 text-xs text-red-600">
          The barangay list could not be loaded. Please try again.
        </p>
      )}

      {value !== "" && (
        <p className="col-span-2 text-xs text-gray-500">
          Current: {value}.{" "}
          {barangayCode === "" && (
            <button
              type="button"
              onClick={() => setIsChanging(false)}
              className="cursor-pointer font-semibold text-brand hover:underline"
            >
              Keep it
            </button>
          )}
        </p>
      )}
    </div>
  );
}
