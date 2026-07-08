import { apiClient } from "@/lib/api-client";
import {
  type Schedule,
  type CreateScheduleDTO,
  type UpdateScheduleDTO,
  type PaginatedResult,
  type ScheduleQueryInput,
} from "./schemas";

export async function getSchedules(query?: ScheduleQueryInput): Promise<PaginatedResult<Schedule>> {
  const { data } = await apiClient.get<PaginatedResult<Schedule>>("/schedules", {
    params: query,
  });
  return data;
}

export async function getScheduleById(id: string): Promise<Schedule> {
  const { data } = await apiClient.get<{ data: Schedule }>(`/schedules/${id}`);
  return data.data;
}

export async function createSchedule(schedule: CreateScheduleDTO): Promise<Schedule> {
  const { data } = await apiClient.post<{ data: Schedule }>("/schedules", schedule);
  return data.data;
}

export async function updateSchedule(id: string, schedule: UpdateScheduleDTO): Promise<Schedule> {
  const { data } = await apiClient.patch<{ data: Schedule }>(`/schedules/${id}`, schedule);
  return data.data;
}

export async function deleteSchedule(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/schedules/${id}`);
  return data;
}
