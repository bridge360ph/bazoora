import type { Stop } from "../types";

export const schedule: Stop[] = [
  {
    stopNumber: "01",
    status: "DONE",
    statusLabel: "DONE • 08:30 AM",
    barangay: "Brgy. San Rafael",
    name: "Sitio Malakas",
    address: "12 households • Residential Area",
    wasteType: "Residual",
    volume: "2.0 cu.m",
    priority: "Medium",
    lat: 14.3845,
    lng: 120.8850,
  },

  {
    stopNumber: "02",
    status: "NOW",
    statusLabel: "NOW",
    barangay: "Brgy. San Rafael",
    name: "Purok 7",
    address: "Industrial Park Hub • Warehouse A",
    wasteType: "Hazardous",
    volume: "1.2 Tons",
    priority: "Critical",
    lat: 14.3860,
    lng: 120.8870,
  },

  {
    stopNumber: "03",
    status: "IN_PROGRESS",
    statusLabel: "IN PROGRESS",
    barangay: "Brgy. Manggahan",
    name: "Purok 12",
    address: "8 households • Commercial Strip",
    wasteType: "Non-Bio",
    volume: "3.0 cu.m",
    priority: "High",
    lat: 14.3880,
    lng: 120.8890,
  },

  {
    stopNumber: "04",
    status: "UPCOMING",
    barangay: "Brgy. Biela",
    name: "Sitio Pag-asa",
    address: "20 households • Village Block",
    wasteType: "Biodegradable",
    volume: "5.5 cu.m",
    priority: "Low",
    lat: 14.3900,
    lng: 120.8910,
  },
];