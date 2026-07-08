import { z } from "zod";

export const userRoleSchema = z.enum([
  "super_admin",
  "government_agency",
  "lgu",
  "hauling_org",
  "business_org",
  "business",
  "resident",
  "driver",
  "eco_aide",
  "citizen",
]);

const addressSchema = z.object({
  line1: z.string(),
  barangay: z.string(),
  city: z.string(),
  province: z.string(),
});

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: userRoleSchema,
  organizationId: z.string().nullable(),
  phoneNumber: z.string().nullable().optional(),
  contactNo: z.string().nullable().optional(),
  address: addressSchema.nullable().optional(),
  notificationPreferences: z
    .object({
      emailNotif: z.boolean().default(true),
      pushNotif: z.boolean().default(true),
      collectionReminder: z.boolean().default(true),
      statusUpdates: z.boolean().default(false),
    })
    .default({
      emailNotif: true,
      pushNotif: true,
      collectionReminder: true,
      statusUpdates: false,
    }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  role: userRoleSchema.optional(),
  organizationId: z.string().nullable().optional(),
  phoneNumber: z.string().optional(),
  contactNo: z.string().optional(),
  address: z.string().optional(),
  notificationPreferences: z
    .object({
      emailNotif: z.boolean().optional(),
      pushNotif: z.boolean().optional(),
      collectionReminder: z.boolean().optional(),
      statusUpdates: z.boolean().optional(),
    })
    .optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type User = z.infer<typeof userSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
