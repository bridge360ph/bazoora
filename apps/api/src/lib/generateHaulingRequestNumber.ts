export function generateHaulingRequestNumber(sequence: number) {
  return `REQ-${String(sequence).padStart(3, "0")}`;
}