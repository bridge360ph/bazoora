import { useMutation, useQueryClient } from "@tanstack/react-query";
import { denyHaulingRequest } from "../denyHaulingRequest";

export function useDenyHaulingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: denyHaulingRequest,

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["hauling-requests"],
      });
    },

    onError: (error) => {
      console.error(error.message);
      alert(error.message); // temporary feedback
    },
  });
}