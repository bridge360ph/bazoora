import { z } from "zod";

const wasteTypeEnum = z.enum(["recyclables", "biodegradable", "residual", "hazardous"]);

const dayOfWeekEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const timeRegex = /^(1[0-2]|0?[1-9]):[0-5]\d\s(AM|PM)$/;

export const scheduleSchema = z.object({
  _id: z.string(),
  day: dayOfWeekEnum,
  time: z.string().regex(timeRegex, "Time must be in h:mm AM/PM format (e.g. 7:30 AM)"),
  waste_type: wasteTypeEnum,
  route: z.string(),
  barangay: z.string(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const createScheduleSchema = z.object({
  day: dayOfWeekEnum,
  time: z
    .string({ error: "Time is required" })
    .regex(timeRegex, "Time must be in h:mm AM/PM format (e.g. 7:30 AM)"),
  waste_type: wasteTypeEnum,
  route: z.string({ error: "Route is required" }).min(1, "Route is required"),
  barangay: z.string({ error: "Barangay is required" }).min(1, "Barangay is required"),
});

export const updateScheduleSchema = z.object({
  day: dayOfWeekEnum.optional(),
  time: z.string().regex(timeRegex, "Time must be in h:mm AM/PM format (e.g. 7:30 AM)").optional(),
  waste_type: wasteTypeEnum.optional(),
  route: z.string().min(1).optional(),
  barangay: z.string().min(1).optional(),
});

export const scheduleQuerySchema = z.object({
  waste_type: wasteTypeEnum.optional(),
  day: dayOfWeekEnum.optional(),
  barangay: z.string().optional(),
  route: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type WasteType = z.infer<typeof wasteTypeEnum>;
export type DayOfWeek = z.infer<typeof dayOfWeekEnum>;
export type Schedule = z.infer<typeof scheduleSchema>;
export type CreateScheduleDTO = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleDTO = z.infer<typeof updateScheduleSchema>;
export type ScheduleQueryInput = z.infer<typeof scheduleQuerySchema>;

export interface MetaInfo {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: MetaInfo;
}

export const toTitleCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
