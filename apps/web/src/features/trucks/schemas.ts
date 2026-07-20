import { z } from "zod";

export const truckStatusSchema = z.enum([
  "active",
  "idle",
  "maintenance",
  "off-duty",
  "assigned",
  "inactive",
]);

export const truckLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  timestamp: z.string().optional(),
});

export const plannedStopSchema = z.object({
  id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  status: z.string(),
  proofPhotoUrl: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  isGPSVerified: z.boolean().optional(),
  dwellTimeSeconds: z.number().optional(),
  verificationMethod: z
    .enum(["manual_photo", "gps_auto", "force_skip", "skipped_exception"])
    .optional(),
  skipReason: z
    .enum(["blocked_access", "no_bin_out", "contamination", "road_detour"])
    .optional()
    .nullable(),
});

export const truckSchema = z.object({
  id: z.string(),
  plateNumber: z.string(),
  status: truckStatusSchema,
  currentLocation: truckLocationSchema.nullable().optional(),
  plannedRoute: z.array(plannedStopSchema).nullable().optional(),
  lastMaintenance: z.string().nullable().optional(),
  organizationId: z.string().nullable().optional(),
});

export type Truck = z.infer<typeof truckSchema>;
export type TruckStatus = z.infer<typeof truckStatusSchema>;
export type TruckLocation = z.infer<typeof truckLocationSchema>;
