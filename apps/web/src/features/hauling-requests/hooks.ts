import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHaulingRequest,
  listHaulingRequests,
  uploadImage,
  updateHaulingRequest,
} from "./haulingRequestApi";
import type { CreateHaulingRequestInput } from "./schemas";
import { toast } from "sonner";

export const haulingKeys = {
  all: ["hauling-requests"] as const,
  lists: () => [...haulingKeys.all, "list"] as const,
};

export function useHaulingRequests() {
  return useQuery({
    queryKey: haulingKeys.lists(),
    queryFn: listHaulingRequests,
  });
}

export function useCreateHaulingRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHaulingRequestInput) =>
      createHaulingRequest(input),

    onSuccess: async () => {
      toast.success("Hauling request submitted successfully!");

      await queryClient.invalidateQueries({
        queryKey: ["hauling-requests"],
      });
    },

    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ?? "Failed to submit request"
      );
    },
  });
}

export function useUpdateHaulingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => updateHaulingRequest(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: haulingKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message ?? "Failed to update request");
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: ({ base64, mimeType }: { base64: string; mimeType: string }) =>
      uploadImage(base64, mimeType),
    onError: () => {
      toast.error("Failed to upload image. Please try again.");
    },
  });
}
