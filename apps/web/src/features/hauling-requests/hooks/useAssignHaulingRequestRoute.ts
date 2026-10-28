import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignHaulingRequestRoute } from "../haulingRouteApi";

export function useAssignHaulingRequestRoute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignHaulingRequestRoute,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hauling-requests"] });
    },
  });
}
