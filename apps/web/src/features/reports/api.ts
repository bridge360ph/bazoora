import { apiClient } from "@/lib/api-client";
import type { CreateReportInput, PublicReport } from "./schemas";

export async function listReports(): Promise<PublicReport[]> {
  const { data } = await apiClient.get<{ success: boolean; data: PublicReport[] }>("/reports");
  return data.data;
}

export async function createReport(input: CreateReportInput): Promise<PublicReport> {
  const { data } = await apiClient.post<{ success: boolean; data: PublicReport }>(
    "/reports",
    input,
  );
  return data.data;
}

export async function uploadReportImage(
  base64: string,
  mimeType: string,
): Promise<{ url: string }> {
  const { data } = await apiClient.post<{ success: boolean; data: { url: string } }>(
    "/uploads/image",
    { base64, mimeType },
  );
  return data.data;
}

export async function getReport(id: string): Promise<PublicReport> {
  const { data } = await apiClient.get<{ success: boolean; data: PublicReport }>(`/reports/${id}`);
  return data.data;
}
