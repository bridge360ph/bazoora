import type { AssignedEcoAide } from "@bazoora/shared";

/**
 * Renders an assigned eco-aide for display.
 *
 * Both name and userNumber are nullable on the API contract, so neither can be
 * interpolated blindly; a user without a display ID would otherwise render as
 * "Jane Cruz (null)".
 */
export function formatAssignedEcoAide(
  ecoAide: AssignedEcoAide | null,
): string {
  if (!ecoAide) {
    return "Unassigned";
  }

  const name = ecoAide.name ?? "Unnamed";

  return ecoAide.userNumber !== null
    ? `${name} (${ecoAide.userNumber})`
    : name;
}
