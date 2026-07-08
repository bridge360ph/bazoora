import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "./api";
import { type UpdateScheduleDTO, type ScheduleQueryInput } from "./schemas";

const SCHEDULES_QUERY_KEY = "schedules";

export function useSchedules(query?: ScheduleQueryInput) {
  return useQuery({
    queryKey: [SCHEDULES_QUERY_KEY, query],
    queryFn: () => getSchedules(query),
  });
}

export function useSchedule(id: string) {
  return useQuery({
    queryKey: [SCHEDULES_QUERY_KEY, id],
    queryFn: () => getScheduleById(id),
    enabled: !!id,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SCHEDULES_QUERY_KEY] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleDTO }) => updateSchedule(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SCHEDULES_QUERY_KEY] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [SCHEDULES_QUERY_KEY] });
    },
  });
}

export function useSchedulesByRoute(routeId: string) {
  return useQuery({
    queryKey: [SCHEDULES_QUERY_KEY, "by-route", routeId],
    queryFn: () => getSchedules({ route: routeId, page: 1, limit: 100 }),
    enabled: !!routeId,
  });
}
