import { z } from "zod";

export const driverTypeSchema = z.enum(["government", "eco_aide"]);
export const notificationStatusSchema = z.enum(["picked_up"]);

export const pickupLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const notificationSchema = z.object({
  id: z.string(),
  residentId: z.string(),
  driverType: driverTypeSchema,
  driverId: z.string(),
  pickupLocation: pickupLocationSchema,
  message: z.string(),
  status: notificationStatusSchema,
  read: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createNotificationInputSchema = z.object({
  residentId: z.string().min(1),
  driverType: driverTypeSchema,
  driverId: z.string().min(1),
  pickupLocation: pickupLocationSchema,
  message: z.string().min(1),
});

export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;
export type DriverType = z.infer<typeof driverTypeSchema>;
