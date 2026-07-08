export interface CookieOptions {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: "Lax" | "Strict" | "None";
  secure?: boolean;
}

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

export function readCookie(name: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const match = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(prefix.length));
}

export function writeCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (!isBrowser()) {
    return;
  }
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `path=${options.path ?? "/"}`,
    `samesite=${options.sameSite ?? "Lax"}`,
  ];

  if (typeof options.maxAgeSeconds === "number") {
    parts.push(`max-age=${String(Math.max(0, Math.floor(options.maxAgeSeconds)))}`);
  }

  // Prefer explicit secure option; fall back to checking the current protocol
  if (options.secure ?? globalThis.location.protocol === "https:") {
    parts.push("secure");
  }

  // Writing document.cookie is intentional in browser contexts
  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = parts.join("; ");
}

export function deleteCookie(name: string): void {
  if (!isBrowser()) {
    return;
  }

  // eslint-disable-next-line unicorn/no-document-cookie
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; samesite=Lax`;
}
