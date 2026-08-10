import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveHaulingRequest } from "../approveHaulingRequest";

export function useApproveHaulingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveHaulingRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["hauling-requests"] });
    },
  });
}