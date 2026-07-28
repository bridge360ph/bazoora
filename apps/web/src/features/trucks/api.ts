import { apiClient } from "@/lib/api-client";
import { truckSchema, type Truck } from "./schemas";
import { z } from "zod";

const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
  });

const truckListSchema = envelope(z.array(truckSchema));

export async function listTrucks(): Promise<Truck[]> {
  const response = await apiClient.get<unknown>("/trucks");
  return truckListSchema.parse(response.data).data;
}

export async function getTruck(id: string): Promise<Truck> {
  const response = await apiClient.get<unknown>(`/trucks/${id}`);
  return envelope(truckSchema).parse(response.data).data;
}
