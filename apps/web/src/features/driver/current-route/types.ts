export type StopStatus =
  | "DONE"
  | "NOW"
  | "IN_PROGRESS"
  | "UPCOMING";


export type Priority =
  | "Critical"
  | "High"
  | "Medium"
  | "Low";


export type WasteType =
  | "Residual"
  | "Hazardous"
  | "Non-Bio"
  | "Biodegradable";


export type Stop = {
  stopNumber: string;

  status: StopStatus;

  /**
   * Optional custom text shown inside status badge
   * Example:
   * "DONE • 08:30 AM"
   * "NOW"
   */
  statusLabel?: string;

  barangay: string;

  /**
   * Collection location name
   * Example:
   * "Sitio Malakas"
   * "Purok 7"
   */
  name: string;

  /**
   * Additional address/details
   * Example:
   * "12 households • Residential Area"
   */
  address: string;

  wasteType: WasteType;

  /**
   * Estimated waste volume
   * Example:
   * "2.0 cu.m"
   * "1.2 Tons"
   */
  volume: string;

  priority: Priority;
};