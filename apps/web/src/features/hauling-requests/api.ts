import axios from "axios";
import { apiClient } from "@/lib/api-client";
import type {
  CreateHaulingRequestInput,
  HaulingRequest,
  PresignedUploadUrlResponse,
} from "@bazoora/shared";

export async function listMyHaulingRequests(): Promise<HaulingRequest[]> {
  const { data } = await apiClient.get<HaulingRequest[]>(
    "/hauling-requests/me",
  );

  return data;
}

export async function createResidentHaulingRequest(
  input: CreateHaulingRequestInput,
): Promise<HaulingRequest> {
  const { data } =
    await apiClient.post<HaulingRequest>(
      "/hauling-requests",
      input,
    );

  return data;
}

/**
 * Uploads a hauling request photo straight to S3 through a presigned URL and
 * returns the file URL to send with the request. Same flow as incident
 * report photos; the API only stores URLs it issued.
 */
export async function uploadHaulingRequestPhoto(file: File): Promise<string> {
  const fileType = file.type || "image/jpeg";

  const { data } = await apiClient.post<PresignedUploadUrlResponse>(
    "/hauling-requests/presigned-url",
    { fileName: file.name, fileType },
  );

  await axios.put(data.uploadUrl, file, {
    headers: {
      "Content-Type": fileType,
    },
  });

  return data.fileUrl;
}
