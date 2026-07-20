import type {
  PickupsChartPoint,
  RevenueChartPoint,
  WasteVolumeChartPoint,
} from "./analytics.types";

export const pickupsData: PickupsChartPoint[] = [
  { day: "Mon", pickups: 4 },
  { day: "Tue", pickups: 7 },
  { day: "Wed", pickups: 5 },
  { day: "Thu", pickups: 9 },
  { day: "Fri", pickups: 6 },
  { day: "Sat", pickups: 11 },
  { day: "Sun", pickups: 3 },
];

export const wasteVolumeData: WasteVolumeChartPoint[] = [
  { name: "Recyclable", value: 54200, color: "#4ade80" },
  { name: "Non-Recyclable", value: 28300, color: "#94a3b8" },
];

export const revenueData: RevenueChartPoint[] = [
  { day: "Mon", revenue: 1200 },
  { day: "Tue", revenue: 2800 },
  { day: "Wed", revenue: 1900 },
  { day: "Thu", revenue: 3500 },
  { day: "Fri", revenue: 2100 },
  { day: "Sat", revenue: 4200 },
  { day: "Sun", revenue: 1300 },
];
