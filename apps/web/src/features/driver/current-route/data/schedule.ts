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
  },
];