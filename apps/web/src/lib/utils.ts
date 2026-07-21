import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "./env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  // Extract origin from API URL (e.g. http://localhost:4000/api/v1 -> http://localhost:4000)
  const origin = env.VITE_API_URL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}
