import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url().default("http://localhost:3000"),
  VITE_SOCKET_URL: z.string().url().default("http://localhost:3000"),
  VITE_APP_NAME: z.string().default("Bazoora"),
  VITE_NOMINATIM_URL: z
    .string()
    .url()
    .default("https://nominatim.openstreetmap.org"),
  VITE_OSRM_URL: z
    .string()
    .url()
    .default("https://router.project-osrm.org"),
  VITE_MAPBOX_ACCESS_TOKEN: z.string().default(""),
});

const rawEnv: Record<string, unknown> = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME ?? "Bazoora",
  VITE_NOMINATIM_URL:
    import.meta.env.VITE_NOMINATIM_URL ??
    "https://nominatim.openstreetmap.org",
  VITE_OSRM_URL:
    import.meta.env.VITE_OSRM_URL ??
    "https://router.project-osrm.org",
  VITE_MAPBOX_ACCESS_TOKEN:
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ?? "",
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error(
    "Invalid env configuration:",
    parsed.error.format(),
  );

  throw new Error("Invalid public environment variables");
}

export const env = parsed.data;