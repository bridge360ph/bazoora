export function generateDisplayId(prefix: string, sequence: number) {
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

export function generateHaulingRequestNumber(sequence: number) {
  return generateDisplayId("REQ", sequence);
}