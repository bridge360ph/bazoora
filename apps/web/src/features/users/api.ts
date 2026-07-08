import { apiClient } from "@/lib/api-client";
import { userSchema, type UpdateUserInput, type User } from "@/features/users/schemas";
import { z } from "zod";

const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
  });

const userListSchema = envelope(z.array(userSchema));
const singleUserSchema = envelope(userSchema);

export async function listUsers(): Promise<User[]> {
  const response = await apiClient.get<unknown>("/users");
  return userListSchema.parse(response.data).data;
}

export async function getUser(id: string): Promise<User> {
  const response = await apiClient.get<unknown>(`/users/${id}`);
  return singleUserSchema.parse(response.data).data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const response = await apiClient.patch<unknown>(`/users/${id}`, input);
  return singleUserSchema.parse(response.data).data;
}

export async function updateMe(input: UpdateUserInput): Promise<User> {
  const response = await apiClient.patch<unknown>("/users/me", input);
  return singleUserSchema.parse(response.data).data;
}

export async function updatePassword(id: string, input: any): Promise<void> {
  await apiClient.patch(`/users/${id}/password`, input);
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}

export async function deleteMe(): Promise<void> {
  await apiClient.delete("/auth/me");
}
