// TEMPORARY ADMIN DEVELOPMENT CHANGE:
//
// Original implementation used the authenticated API client:
//
// import { apiClient } from "@/lib/api-client";
//
// This was changed temporarily because the admin side currently has no
// authentication flow implemented yet.
//
// The existing apiClient:
// - sends credentials (`withCredentials: true`)
// - expects refresh-token cookies
// - attaches Authorization headers
// - attempts token refresh on 401 responses
//
// Since admin authentication is not implemented, browsers reject these
// requests due to CORS credential requirements.
//
// TODO: Remove this temporary client once admin authentication exists.
// After that, restore the original apiClient import and requests below.
import { adminApiClient } from "@/lib/admin-dev-api-client";

import { truckSchema, type Truck } from "./schemas";
import { z } from "zod";


// ORIGINAL:
// import { apiClient } from "@/lib/api-client";
//
// FUTURE:
// Replace adminApiClient with apiClient once admin authentication exists.


const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
  });


const truckListSchema = envelope(z.array(truckSchema));


// TEMPORARY ADMIN IMPLEMENTATION:
//
// Uses adminApiClient instead of apiClient because this endpoint is currently
// accessed from admin pages before admin authentication exists.
//
// Remove this import and replace all adminApiClient usages with apiClient
// after authentication is implemented.
export async function listTrucks(): Promise<Truck[]> {
  const response = await adminApiClient.get<unknown>("/trucks");

  return truckListSchema.parse(response.data).data;
}


// TEMPORARY ADMIN IMPLEMENTATION:
//
// Same reasoning as listTrucks() above.
// This should return to apiClient once admin authentication is available.
export async function getTruck(id: string): Promise<Truck> {
  const response = await adminApiClient.get<unknown>(`/trucks/${id}`);

  return envelope(truckSchema).parse(response.data).data;
}


// ORIGINAL IMPLEMENTATION:
//
// export async function listTrucks(): Promise<Truck[]> {
//   const response = await apiClient.get<unknown>("/trucks");
//   return truckListSchema.parse(response.data).data;
// }
//
// export async function getTruck(id: string): Promise<Truck> {
//   const response = await apiClient.get<unknown>(`/trucks/${id}`);
//   return envelope(truckSchema).parse(response.data).data;
// }