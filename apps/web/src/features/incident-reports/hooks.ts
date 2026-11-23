import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listIncidentReports, updateIncidentReport } from "./api";

export const incidentReportsQueryKey = ["incident-reports", "admin"] as const;

export function useIncidentReports() {
  return useQuery({
    queryKey: incidentReportsQueryKey,
    queryFn: listIncidentReports,
  });
}

export function useUpdateIncidentReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateIncidentReport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: incidentReportsQueryKey,
      });
    },
  });
}
