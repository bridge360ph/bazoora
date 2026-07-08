import { z } from "zod";

export const REPORT_TYPES = [
  "missed-pickup",
  "inaccessible-area",
  "vehicle-problem",
  "collection-delay",
  "road-blockage",
  "other",
] as const;

export const WASTE_TYPES = [
  "biodegradable",
  "non-biodegradable",
  "recyclable",
  "hazardous",
  "residual",
] as const;

export const REPORT_STATUSES = ["pending", "in-progress", "resolved"] as const;

export const createReportSchema = z.object({
  type: z.enum(REPORT_TYPES, "Please select a report type"),
  wasteType: z.enum(WASTE_TYPES, "Please select a waste type"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description is too long"),
  photoUrl: z.string().optional().nullable(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export interface PublicReport {
  id: string;
  reportId: string;
  type: (typeof REPORT_TYPES)[number];
  wasteType: (typeof WASTE_TYPES)[number];
  description: string;
  status: (typeof REPORT_STATUSES)[number];
  photoUrl: string | null;
  userId: string;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
}
