import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPaidHaulingRoute } from "../haulingRouteApi";

export function useCreatePaidHaulingRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaidHaulingRoute,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["hauling-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["hauling-feasibility"] }),
      ]);
    },
  });
}
