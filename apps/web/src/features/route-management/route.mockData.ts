import type { CollectionDay, Route, WasteType } from "./route.types";

export const INITIAL_ROUTES: Route[] = [
  {
    id: "RT-001",
    routeNumber: 1,
    name: "Brgy. Poblacion Loop",
    barangay: "Brgy. Poblacion",
    waypoints: "SoJuu Korean BBQ, KuChi Tea, Red Ribbon",
    wasteType: "Regular",
    collectionDay: "Sunday",
    startTime: "10:00 AM",
    ecoAide: "Ferdinand Ramos",
    fleetAssignment: "FL-001",
    status: "In Progress",
    stops: 3,
    routeType: "Paid",
  },
  {
    id: "RT-002",
    routeNumber: 2,
    name: "Brgy. Mabalanoy Loop",
    barangay: "Brgy. Mabalanoy",
    waypoints: "Stop A, Stop B, Stop C, Stop D",
    wasteType: "Recyclable",
    collectionDay: "Sunday",
    startTime: "12:00 PM",
    ecoAide: "Emil Flores",
    fleetAssignment: "FL-002",
    status: "Completed",
    stops: 4,
    routeType: "Free",
  },
  {
    id: "RT-003",
    routeNumber: 3,
    name: "Brgy. Sampiro Loop",
    barangay: "Brgy. Sampiro",
    waypoints: "Point X, Point Y",
    wasteType: "Recyclable",
    collectionDay: "Monday",
    startTime: "3:00 PM",
    ecoAide: "-",
    fleetAssignment: "FL-003",
    status: "Not Started",
    stops: 2,
    routeType: "Free",
  },
  {
    id: "RT-004",
    routeNumber: 4,
    name: "Brgy. Pinagbayanan",
    barangay: "Brgy. Pinagbayanan",
    waypoints: "Site 1, Site 2",
    wasteType: "Regular",
    collectionDay: "Tuesday",
    startTime: "3:00 PM",
    ecoAide: "Romeo Rosario",
    fleetAssignment: "FL-004",
    status: "Not Started",
    stops: 2,
    routeType: "Paid",
  },
];

export const ECO_AIDE_OPTIONS = [
  "Ferdinand Ramos (001)",
  "Emil Flores (002)",
  "John Mendoza (003)",
  "Romeo Rosario (004)",
  "-",
];

export const FLEET_OPTIONS = ["FL-001", "FL-002", "FL-003", "FL-004", "FL-005"];

export const WASTE_TYPES: WasteType[] = [
  "Regular",
  "Recyclable",
  "Regular/Non-Recyclable",
];

export const COLLECTION_DAYS: CollectionDay[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
