import { apiClient } from "../../lib/api-client";

export interface AnalyticsOverview {
  totals: {
    ecoAides: number;
    trucks: number;
    assignedTrucks: number;
  };
  truckStatus: Array<{
    name: string;
    value: number;
  }>;
}

interface AnalyticsOverviewResponse {
  success: true;
  data: AnalyticsOverview;
}

export async function getAnalyticsOverview() {
  const response =
    await apiClient.get<AnalyticsOverviewResponse>("/analytics/overview");

  return response.data.data;
}
