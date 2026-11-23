import axios from "axios";
import type {
  IncidentReport,
  UpdateIncidentReportInput,
} from "@bazoora/shared";

import { apiClient } from "@/lib/api-client";

/**
 * Turns an API failure into an Error carrying the server's message when it
 * sent one (for example the 409 when a report is already closed).
 */
function toIncidentReportError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const message = (
      error.response?.data as { message?: string } | undefined
    )?.message;

    if (message) return new Error(message);
  }

  return new Error(fallback);
}

// GET /incidents (admin)
export async function listIncidentReports(): Promise<IncidentReport[]> {
  try {
    const { data } = await apiClient.get<IncidentReport[]>("/incidents");
    return data;
  } catch (error) {
    throw toIncidentReportError(error, "Failed to load incident reports");
  }
}

export interface UpdateIncidentReportVariables {
  id: string;
  input: UpdateIncidentReportInput;
}

// PATCH /incidents/:id (admin)
export async function updateIncidentReport({
  id,
  input,
}: UpdateIncidentReportVariables): Promise<IncidentReport> {
  try {
    const { data } = await apiClient.patch<IncidentReport>(
      `/incidents/${id}`,
      input,
    );
    return data;
  } catch (error) {
    throw toIncidentReportError(error, "Failed to update incident report");
  }
}
