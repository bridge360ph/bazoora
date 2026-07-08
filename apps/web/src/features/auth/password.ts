export interface PasswordRequirement {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS = [
  {
    key: "length",
    label: "At least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  {
    key: "uppercase",
    label: "Uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    key: "lowercase",
    label: "Lowercase letter",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    key: "number",
    label: "Number",
    test: (password: string) => /\d/.test(password),
  },
  {
    key: "special",
    label: "Special character",
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const satisfies readonly PasswordRequirement[];

export type PasswordRequirementKey = (typeof PASSWORD_REQUIREMENTS)[number]["key"];

export function getPasswordRequirementChecks(password: string) {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    met: requirement.test(password),
  }));
}

export function isStrongRegistrationPassword(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
}
