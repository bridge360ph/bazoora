import type { Truck } from "./fleet.types";

export const INITIAL_TRUCKS: Truck[] = [
  {
    id: "FL-001",
    plateNumber: "GTM-5895",
    model: "Isuzu Elf",
    capacity: "7000 kg",
    status: "Active",
    assignedDriver: "Henry Correa",
    registeredDate: "22/03/2026",
    assignedRoute: "RT-001",
    assignedEcoAide: "EA-001",
  },
  {
    id: "FL-002",
    plateNumber: "FCB-1899",
    model: "Isuzu Elf",
    capacity: "5000 kg",
    status: "Idle",
    assignedDriver: "Julian De Silva",
    registeredDate: "22/03/2026",
  },
  {
    id: "FL-003",
    plateNumber: "LFC-1892",
    model: "Dongfeng",
    capacity: "9000 kg",
    status: "Under Maintenance",
    assignedDriver: "William Chua",
    registeredDate: "20/03/2026",
  },
  {
    id: "FL-004",
    plateNumber: "MIT-2125",
    model: "Komatsu",
    capacity: "15000 kg",
    status: "Idle",
    assignedDriver: "Miguel Lorenzo",
    registeredDate: "12/03/2026",
  },
  {
    id: "FL-005",
    plateNumber: "ASU-3852",
    model: "Komatsu",
    capacity: "10000 kg",
    status: "Active",
    assignedDriver: "Damian Celiz",
    registeredDate: "25/02/2026",
  },
];

export const ROUTE_OPTIONS = ["RT-001", "RT-002", "RT-003", "RT-004", "RT-005"];

export const ECO_AIDE_OPTIONS = ["EA-001", "EA-002", "EA-003", "EA-004", "EA-005"];
