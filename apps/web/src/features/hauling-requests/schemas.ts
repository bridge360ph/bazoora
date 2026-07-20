import { z } from "zod";

export const HAULING_WASTE_TYPES = [
  "bulky",
  "garden",
  "construction",
  "electronic",
  "general",
] as const;
export const HAULING_VOLUMES = ["small", "medium", "large", "truckload"] as const;
export const HAULING_STATUSES = ["pending", "approved", "completed", "cancelled"] as const;

export const createHaulingRequestSchema = z.object({
  wasteType: z.enum(HAULING_WASTE_TYPES, "Please select a waste type"),
  volume: z.enum(HAULING_VOLUMES, "Please select a volume"),
  pickupAddress: z.string().min(5, "Address is too short"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  preferredDate: z.string().min(1, "Please select a date"),
  notes: z.string().max(500).optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  paymentMethod: z.enum(["cash", "online"], { message: "Please select a payment method" }),
});

export type CreateHaulingRequestInput = z.infer<typeof createHaulingRequestSchema>;

export interface PublicHaulingRequest {
  id: string;
  requestId: string;
  wasteType: (typeof HAULING_WASTE_TYPES)[number];
  volume: (typeof HAULING_VOLUMES)[number];
  pickupAddress: string;
  lat?: number;
  lng?: number;
  preferredDate: string;
  notes: string | null;
  photoUrl: string | null;
  status: (typeof HAULING_STATUSES)[number];
  declineReason?: string | null;
  userId: string;
  organizationId: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  completedByName?: string | null;
  price: number;
  paymentMethod: "cash" | "online";
  paymentStatus: "unpaid" | "paid";
  createdAt: string;
  updatedAt: string;
}
