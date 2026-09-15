import axios from "axios";
import { apiClient } from "@/lib/api-client";
import type {
  CreateIncidentReportInput,
  IncidentReport,
  PresignedUploadUrlRequest,
  PresignedUploadUrlResponse,
} from "@bazoora/shared";

/**
 * FETCH INCIDENT REPORTS CREATED BY CURRENT USER
 */
export async function getMyIncidentReports(): Promise<IncidentReport[]> {
  const { data } = await apiClient.get<IncidentReport[]>("/incidents/me");
  return data;
}

/**
 * REQUEST S3 PRESIGNED PUT URL FOR DIRECT ATTACHMENT UPLOADS
 */
export async function getPresignedUploadUrl(
  params: PresignedUploadUrlRequest,
): Promise<PresignedUploadUrlResponse> {
  const { data } = await apiClient.post<PresignedUploadUrlResponse>(
    "/incidents/presigned-url",
    params,
  );
  return data;
}

/**
 * UPLOAD FILE DIRECTLY TO AWS S3 VIA PRESIGNED URL
 */
export async function uploadFileToS3(file: File): Promise<string> {
  const { uploadUrl, fileUrl } = await getPresignedUploadUrl({
    fileName: file.name,
    fileType: file.type || "image/jpeg",
  });

  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type || "image/jpeg",
    },
  });

  return fileUrl;
}

/**
 * CONVERT FILE TO BASE64 DATA URI FOR LOCAL STORAGE
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * UNIFIED PHOTO UPLOADER
 * SWITCH TO uploadFileToS3(file) ONCE AWS S3 CREDENTIALS ARE PROVIDED
 */
export async function uploadIncidentPhoto(file: File): Promise<string> {
  // LOCAL DEVELOPMENT: ENCODE AS BASE64 DATA URI
  return fileToBase64(file);
}

/**
 * SUBMIT INCIDENT REPORT RECORD TO BACKEND
 */
export async function submitIncidentReport(
  payload: CreateIncidentReportInput,
): Promise<IncidentReport> {
  const { data } = await apiClient.post<IncidentReport>("/incidents", payload);
  return data;
}