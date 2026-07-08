import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Bazoora"),
  NEXT_PUBLIC_NOMINATIM_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
  NEXT_PUBLIC_OSRM_URL: z.string().url().default("https://router.project-osrm.org"),
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().default(""),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: import.meta.env.VITE_API_URL,
  NEXT_PUBLIC_SOCKET_URL: import.meta.env.VITE_API_URL,
  NEXT_PUBLIC_APP_NAME: "Bazoora",
  NEXT_PUBLIC_NOMINATIM_URL: "https://nominatim.openstreetmap.org",
  NEXT_PUBLIC_OSRM_URL: "https://router.project-osrm.org",
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
});

if (!parsed.success) {
  console.error("Invalid env configuration:", parsed.error.format());
  throw new Error("Invalid public environment variables");
}

export const env = parsed.data;
