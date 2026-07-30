export function generateDisplayId(prefix: string, sequence: number) {
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

export function generateTruckNumber(sequence: number) {
  return generateDisplayId("FL", sequence);
}

export function generateEcoAideNumber(sequence: number) {
  return generateDisplayId("EA", sequence);
}

export function generateRouteNumber(sequence: number) {
  return generateDisplayId("RT", sequence);
}