import { z } from "zod";
import { isStrongRegistrationPassword } from "@/features/auth/password";

export const authUserRoleSchema = z.enum([
  "super_admin",
  "government_agency",
  "lgu",
  "hauling_org",
  "business_org",
  "business",
  "resident",
  "driver",
  "eco_aide",
  "citizen",
]);

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "Enter the 4-digit code");

export const emailOnlySchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  keepMeLoggedIn: z.boolean().optional().default(false),
});

const firstNameSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || val.length > 0, "First name is required when provided")
  .refine((val) => val === "" || val.length <= 80, "First name is too long");

const lastNameSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || val.length > 0, "Last name is required when provided")
  .refine((val) => val === "" || val.length <= 80, "Last name is too long");

const contactNumberSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || /^\d{10}$/.test(val), "Enter exactly 10 mobile digits")
  .refine(
    (val) => val === "" || val.startsWith("9"),
    "Mobile number must start with 9 (e.g. 9XX XXX XXXX)",
  );

const streetAddressSchema = z.string().trim().min(1, "Street address is required").max(180);
const provinceNameSchema = z.string().trim().min(1, "Select a province");
const cityMunicipalityNameSchema = z.string().trim().min(1, "Select a city/municipality");
const barangayNameSchema = z.string().trim().min(1, "Select a barangay");

const registerAddressSchema = z.union([
  z.object({
    line1: z.string().trim().min(1, "Street address is required").max(180),
    barangay: z.string().trim().min(1, "Select a barangay"),
    city: z.string().trim().min(1, "Select a city/municipality"),
    province: z.string().trim().min(1, "Select a province"),
  }),
  z.tuple([
    z.string().min(1, "Province and city are required"),
    z.string().min(1, "Barangay is required"),
    z.string().min(1, "Street address is required"),
  ]),
]);

const accountPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(isStrongRegistrationPassword, {
    message: "Use uppercase, lowercase, a number, and a special character",
  });

const organizationNameSchema = z.string().trim().min(1, "Organization name is required");
const governmentAgencyNameSchema = z
  .string()
  .trim()
  .refine((val) => val === "" || val.length > 0, "Name is required when provided")
  .optional();
const organizationEmailSchema = z.string().email("Enter a valid email");

export const registerSchema = z.object({
  role: authUserRoleSchema.default("resident"),
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),
  email: z.string().email("Enter a valid email"),
  password: accountPasswordSchema,
  keepMeLoggedIn: z.boolean().optional().default(false),
  contactNumber: contactNumberSchema,
  orgId: z.string().nullable().optional(),
  address: registerAddressSchema,
  governmentAgencyName: z.string().optional(),
  verificationToken: z.string().optional(),
});

export const registerFormSchema = z
  .object({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    email: z.string().email("Enter a valid email"),
    contactNumber: contactNumberSchema,
    streetAddress: streetAddressSchema,
    provinceName: provinceNameSchema,
    cityMunicipalityName: cityMunicipalityNameSchema,
    barangayName: barangayNameSchema,
    orgId: z.string().nullable().optional(),
    governmentAgencyName: governmentAgencyNameSchema,
    password: accountPasswordSchema.optional(),
    confirmPassword: z.string().min(8, "Confirm your password").optional(),
    orgName: z.string().trim().optional(),
    contact: z.string().trim().optional(),
    address: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== undefined && values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const organizationRequestFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  contactNumber: contactNumberSchema,
  organizationName: organizationNameSchema,
  streetAddress: streetAddressSchema,
  provinceName: provinceNameSchema,
  cityMunicipalityName: cityMunicipalityNameSchema,
  barangayName: barangayNameSchema,
});

export const organizationRegisterFormSchema = z
  .object({
    organizationName: organizationNameSchema,
    contactNumber: contactNumberSchema,
    email: organizationEmailSchema,
    password: accountPasswordSchema,
    confirmPassword: z.string().min(8, "Confirm your password"),
    streetAddress: streetAddressSchema,
    provinceName: provinceNameSchema,
    cityMunicipalityName: cityMunicipalityNameSchema,
    barangayName: barangayNameSchema,
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const completeOrganizationSignupSchema = z
  .object({
    email: z.string().email("Enter a valid email"),
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    contactNumber: contactNumberSchema,
    streetAddress: streetAddressSchema,
    provinceName: provinceNameSchema,
    cityMunicipalityName: cityMunicipalityNameSchema,
    barangayName: barangayNameSchema,
    password: accountPasswordSchema,
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export const forgotPasswordFormSchema = emailOnlySchema;

export const resetPasswordFormSchema = z
  .object({
    newPassword: accountPasswordSchema,
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine(isStrongRegistrationPassword, {
        message: "Use uppercase, lowercase, a number, and a special character",
      }),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: authUserRoleSchema,
  organizationId: z.string().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const authResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: authUserSchema,
    accessToken: z.string(),
  }),
});

export const otpDeliveryResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .object({
      message: z.string().optional(),
      expiresInSeconds: z.number().int().positive().default(300),
      cooldownSeconds: z.number().int().nonnegative().default(30),
    }),
});

export const verifyForgotPasswordOtpSchema = emailOnlySchema.extend({
  otp: otpCodeSchema,
});

export const verifyForgotPasswordOtpResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    resetToken: z.string(),
    message: z.string().optional(),
  }),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: accountPasswordSchema,
});

export const verifyRegistrationOtpSchema = emailOnlySchema.extend({
  otp: otpCodeSchema,
});

export const verifyRegistrationOtpResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    verificationToken: z.string(),
    message: z.string().optional(),
  }),
});

export const genericSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z
    .object({
      message: z.string().optional(),
    }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type OrganizationRequestFormValues = z.infer<typeof organizationRequestFormSchema>;
export type OrganizationRegisterFormValues = z.infer<typeof organizationRegisterFormSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuthUserRole = z.infer<typeof authUserRoleSchema>;
export type RequestOtpInput = z.infer<typeof emailOnlySchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;
export type VerifyForgotPasswordOtpInput = z.infer<typeof verifyForgotPasswordOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
export type VerifyRegistrationOtpInput = z.infer<typeof verifyRegistrationOtpSchema>;
export type OtpDeliveryResponseData = z.infer<typeof otpDeliveryResponseSchema>["data"];
export type VerifyForgotPasswordOtpResponseData = z.infer<
  typeof verifyForgotPasswordOtpResponseSchema
>["data"];
export type VerifyRegistrationOtpResponseData = z.infer<
  typeof verifyRegistrationOtpResponseSchema
>["data"];
export type GenericSuccessResponseData = z.infer<typeof genericSuccessResponseSchema>["data"];
