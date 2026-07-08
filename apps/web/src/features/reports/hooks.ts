import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createReport, getReport, listReports } from "./api";
import type { CreateReportInput } from "./schemas";
import { toast } from "sonner";

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (filters: string) => [...reportKeys.lists(), { filters }] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
};

export function useReports() {
  return useQuery({
    queryKey: reportKeys.lists(),
    queryFn: listReports,
  });
}

export function useReport(id: string) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => getReport(id),
    enabled: !!id,
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReportInput) => createReport(input),
    onSuccess: () => {
      toast.success("Report submitted successfully");
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit report");
    },
  });
}

export function useUploadReportImage() {
  return useMutation({
    mutationFn: ({ base64, mimeType }: { base64: string; mimeType: string }) =>
      import("./api").then((api) => api.uploadReportImage(base64, mimeType)),
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload image");
    },
  });
}
