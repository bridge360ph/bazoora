import argon2 from "argon2";

export interface PasswordRequirement {
  key:
    | "length"
    | "lowercase"
    | "uppercase"
    | "number"
    | "specialCharacter";
  message: string;
  isValid: boolean;
}

const LOWERCASE_PATTERN = /[a-z]/;
const UPPERCASE_PATTERN = /[A-Z]/;
const NUMBER_PATTERN = /\d/;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

export function getPasswordRequirements(
  password: string,
): PasswordRequirement[] {
  return [
    {
      key: "length",
      message: "Password must be between 8 and 128 characters.",
      isValid: password.length >= 8 && password.length <= 128,
    },
    {
      key: "lowercase",
      message: "Password must contain at least one lowercase letter.",
      isValid: LOWERCASE_PATTERN.test(password),
    },
    {
      key: "uppercase",
      message: "Password must contain at least one uppercase letter.",
      isValid: UPPERCASE_PATTERN.test(password),
    },
    {
      key: "number",
      message: "Password must contain at least one number.",
      isValid: NUMBER_PATTERN.test(password),
    },
    {
      key: "specialCharacter",
      message: "Password must contain at least one special character.",
      isValid: SPECIAL_CHARACTER_PATTERN.test(password),
    },
  ];
}

export function getPasswordValidationErrors(password: string): string[] {
  return getPasswordRequirements(password)
    .filter((requirement) => !requirement.isValid)
    .map((requirement) => requirement.message);
}

export function isPasswordValid(password: string): boolean {
  return getPasswordValidationErrors(password).length === 0;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}
