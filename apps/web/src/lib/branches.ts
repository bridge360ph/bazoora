import { env } from "./env";

export interface Branch {
  id: string;
  name: string;
  /** The city or municipality, used in messages. */
  city: string;
  lat: number;
  lng: number;
}

/**
 * Bazoora branches (truck depots) in Luzon. Positions are city centres for
 * now; replace them with each branch's real address when known.
 *
 * The head office comes from VITE_DEPOT_NAME, VITE_DEPOT_LAT and
 * VITE_DEPOT_LNG (default: Makati).
 */
export const BRANCHES: readonly Branch[] = [
  { id: "hq", name: env.DEPOT_NAME, city: "Makati", lat: env.DEPOT_LAT, lng: env.DEPOT_LNG },
  // Metro Manila
  { id: "quezon-city", name: "Quezon City Branch", city: "Quezon City", lat: 14.676, lng: 121.0437 },
  { id: "manila", name: "Manila Branch", city: "Manila", lat: 14.5995, lng: 120.9842 },
  { id: "caloocan", name: "Caloocan Branch", city: "Caloocan", lat: 14.6507, lng: 120.9676 },
  { id: "valenzuela", name: "Valenzuela Branch", city: "Valenzuela", lat: 14.7011, lng: 120.983 },
  { id: "pasig", name: "Pasig Branch", city: "Pasig", lat: 14.5764, lng: 121.0851 },
  { id: "paranaque", name: "Paranaque Branch", city: "Paranaque", lat: 14.4793, lng: 121.0198 },
  // Central Luzon
  { id: "malolos", name: "Malolos Branch", city: "Malolos, Bulacan", lat: 14.8527, lng: 120.816 },
  { id: "san-fernando-pampanga", name: "San Fernando Branch", city: "San Fernando, Pampanga", lat: 15.0286, lng: 120.6898 },
  { id: "angeles", name: "Angeles Branch", city: "Angeles", lat: 15.145, lng: 120.5887 },
  { id: "olongapo", name: "Olongapo Branch", city: "Olongapo", lat: 14.8292, lng: 120.2828 },
  { id: "tarlac", name: "Tarlac Branch", city: "Tarlac City", lat: 15.4755, lng: 120.5963 },
  { id: "cabanatuan", name: "Cabanatuan Branch", city: "Cabanatuan, Nueva Ecija", lat: 15.4865, lng: 120.9667 },
  // CALABARZON
  { id: "imus", name: "Imus Branch", city: "Imus, Cavite", lat: 14.4297, lng: 120.9367 },
  { id: "calamba", name: "Calamba Branch", city: "Calamba, Laguna", lat: 14.2117, lng: 121.1653 },
  { id: "antipolo", name: "Antipolo Branch", city: "Antipolo, Rizal", lat: 14.5865, lng: 121.1753 },
  { id: "batangas", name: "Batangas Branch", city: "Batangas City", lat: 13.7565, lng: 121.0583 },
  { id: "lipa", name: "Lipa Branch", city: "Lipa, Batangas", lat: 13.9411, lng: 121.1631 },
  { id: "lucena", name: "Lucena Branch", city: "Lucena, Quezon", lat: 13.9373, lng: 121.617 },
  // North Luzon
  { id: "dagupan", name: "Dagupan Branch", city: "Dagupan, Pangasinan", lat: 16.0433, lng: 120.3333 },
  { id: "baguio", name: "Baguio Branch", city: "Baguio", lat: 16.4023, lng: 120.596 },
  { id: "san-fernando-la-union", name: "La Union Branch", city: "San Fernando, La Union", lat: 16.6159, lng: 120.3166 },
  { id: "vigan", name: "Vigan Branch", city: "Vigan, Ilocos Sur", lat: 17.5747, lng: 120.3869 },
  { id: "laoag", name: "Laoag Branch", city: "Laoag, Ilocos Norte", lat: 18.196, lng: 120.5927 },
  { id: "santiago", name: "Santiago Branch", city: "Santiago, Isabela", lat: 16.688, lng: 121.5487 },
  { id: "tuguegarao", name: "Tuguegarao Branch", city: "Tuguegarao, Cagayan", lat: 17.6132, lng: 121.727 },
  // Bicol
  { id: "naga", name: "Naga Branch", city: "Naga, Camarines Sur", lat: 13.6218, lng: 123.1948 },
  { id: "legazpi", name: "Legazpi Branch", city: "Legazpi, Albay", lat: 13.1391, lng: 123.7438 },
];

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** The middle of a set of points. */
export function centroidOf(points: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** Branches closest to the stops in a straight line, nearest first. */
export function nearestBranches(
  points: { lat: number; lng: number }[],
  count = 3,
): Branch[] {
  const centre = centroidOf(points);
  if (!centre) return BRANCHES.slice(0, 1);

  return [...BRANCHES]
    .sort((a, b) => haversineMeters(a, centre) - haversineMeters(b, centre))
    .slice(0, count);
}
