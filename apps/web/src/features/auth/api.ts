import { apiClient } from "@/lib/api-client";
import { toInternationalPhilippineMobileNumber } from "@/features/auth/formatters";
import {
  authResponseSchema,
  type AuthResponse,
  emailOnlySchema,
  genericSuccessResponseSchema,
  otpDeliveryResponseSchema,
  resetPasswordSchema,
  verifyForgotPasswordOtpResponseSchema,
  verifyForgotPasswordOtpSchema,
  verifyRegistrationOtpResponseSchema,
  verifyRegistrationOtpSchema,
  type LoginInput,
  type RegisterInput,
  type OtpDeliveryResponseData,
  type GenericSuccessResponseData,
  type RequestOtpInput,
  type ResetPasswordInput,
  type VerifyForgotPasswordOtpResponseData,
  type VerifyForgotPasswordOtpInput,
  type VerifyRegistrationOtpResponseData,
  type VerifyRegistrationOtpInput,
  type ChangePasswordFormValues,
} from "@/features/auth/schemas";

export async function login(input: LoginInput): Promise<AuthResponse["data"]> {
  const response = await apiClient.post<unknown>("/auth/login", {
    email: input.email,
    password: input.password,
  });
  return authResponseSchema.parse(response.data).data;
}

export async function register(input: RegisterInput): Promise<AuthResponse["data"]> {
  const payload = {
    role: input.role,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
    contactNumber: input.contactNumber
      ? toInternationalPhilippineMobileNumber(input.contactNumber)
      : undefined,
    orgId: input.orgId ?? null,
    address: input.address,
    verificationToken: input.verificationToken,
  };

  const response = await apiClient.post<unknown>("/auth/register", payload);
  return authResponseSchema.parse(response.data).data;
}

export async function requestForgotPasswordOtp(
  input: RequestOtpInput,
): Promise<OtpDeliveryResponseData> {
  const payload = emailOnlySchema.parse(input);
  const response = await apiClient.post<unknown>(
    "/auth/forgot-password/request-magic-link",
    payload,
  );
  return otpDeliveryResponseSchema.parse(response.data).data;
}

export async function verifyForgotPasswordOtp(
  input: VerifyForgotPasswordOtpInput,
): Promise<VerifyForgotPasswordOtpResponseData> {
  const payload = verifyForgotPasswordOtpSchema.parse(input);
  const response = await apiClient.post<unknown>(
    "/auth/forgot-password/verify-magic-link",
    payload,
  );
  return verifyForgotPasswordOtpResponseSchema.parse(response.data).data;
}

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<GenericSuccessResponseData> {
  const payload = resetPasswordSchema.parse(input);
  const response = await apiClient.post<unknown>("/auth/forgot-password/reset", payload);
  return genericSuccessResponseSchema.parse(response.data).data;
}

export async function requestRegisterOtp(input: RequestOtpInput): Promise<OtpDeliveryResponseData> {
  const payload = emailOnlySchema.parse(input);
  const response = await apiClient.post<unknown>("/auth/register/request-otp", payload);
  return otpDeliveryResponseSchema.parse(response.data).data;
}

export async function verifyRegisterOtp(
  input: VerifyRegistrationOtpInput,
): Promise<VerifyRegistrationOtpResponseData> {
  const payload = verifyRegistrationOtpSchema.parse(input);
  const response = await apiClient.post<unknown>("/auth/register/verify-otp", payload);
  return verifyRegistrationOtpResponseSchema.parse(response.data).data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function changePassword(
  input: ChangePasswordFormValues,
): Promise<GenericSuccessResponseData> {
  const response = await apiClient.post<unknown>("/auth/change-password", input);
  return genericSuccessResponseSchema.parse(response.data).data;
}
