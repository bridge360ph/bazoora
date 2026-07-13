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


const parsed = envSchema.safeParse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_API_URL,
  VITE_APP_NAME: "Bazoora",
  VITE_NOMINATIM_URL:
    "https://nominatim.openstreetmap.org",
  VITE_OSRM_URL:
    "https://router.project-osrm.org",
  VITE_MAPBOX_ACCESS_TOKEN:
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
});


if (!parsed.success) {
  console.error(
    "Invalid env configuration:",
    parsed.error.format()
  );

  throw new Error(
    "Invalid public environment variables"
  );
}


/*
  Keep backwards compatibility.
  Existing files still use NEXT_PUBLIC_*.
*/

export const env = {
  ...parsed.data,

  NEXT_PUBLIC_API_URL:
    parsed.data.VITE_API_URL,

  NEXT_PUBLIC_SOCKET_URL:
    parsed.data.VITE_SOCKET_URL,

  NEXT_PUBLIC_APP_NAME:
    parsed.data.VITE_APP_NAME,

  NEXT_PUBLIC_NOMINATIM_URL:
    parsed.data.VITE_NOMINATIM_URL,

  NEXT_PUBLIC_OSRM_URL:
    parsed.data.VITE_OSRM_URL,

  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
    parsed.data.VITE_MAPBOX_ACCESS_TOKEN,
};