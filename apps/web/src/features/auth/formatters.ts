export function capitalizeNameValue(value: string | undefined | null): string {
  if (!value) return "";
  const normalized = value.trimStart().replaceAll(/\s+/g, " ");

  return normalized
    .split(/(\s+|-)/)
    .map((segment) => {
      if (segment === " " || segment === "-" || !segment) {
        return segment;
      }

      return `${segment.charAt(0).toUpperCase()}${segment.slice(1).toLowerCase()}`;
    })
    .join("")
    .trim();
}

export function normalizePhilippineMobileDigits(value: string): string {
  const digits = value.replaceAll(/\D/g, "");

  if (digits.startsWith("63") && digits.length >= 12) {
    return digits.slice(2, 12);
  }

  if (digits.startsWith("0") && digits.length >= 11) {
    return digits.slice(1, 11);
  }

  return digits.slice(0, 10);
}

export function formatPhilippineMobileDigits(value: string): string {
  const digits = normalizePhilippineMobileDigits(value);

  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean);
  return parts.join(" ");
}

export function toInternationalPhilippineMobileNumber(value: string): string {
  const digits = normalizePhilippineMobileDigits(value);
  return digits ? `+63${digits}` : "";
}
