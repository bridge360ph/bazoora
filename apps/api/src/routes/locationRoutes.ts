import type { FastifyPluginCallback } from "fastify";

const PSGC_API_URL = "https://psgc.cloud/api";
const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 60 * 60 * 1000;

interface Region {
  code: string;
  name: string;
}

interface Province {
  code: string;
  name: string;
}

interface Locality {
  code: string;
  name: string;
  type: string;
  zip_code: string;
  district?: string;
}

interface Barangay {
  code: string;
  name: string;
  status?: string;
}

interface CacheEntry {
  expiresAt: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();

function repairMojibake(value: string): string {
  if (!/[ÃÂâ]/.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(
      Array.from(value, (character) => character.charCodeAt(0)),
    );

    return new TextDecoder("utf-8", {
      fatal: true,
    }).decode(bytes);
  } catch {
    return value;
  }
}

function normalizeLocationNames(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => normalizeLocationNames(item));
  }

  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;

    const normalizedEntries = Object.entries(record).map(
      ([key, item]): [string, unknown] => [
        key,
        key === "name" && typeof item === "string"
          ? repairMojibake(item)
          : normalizeLocationNames(item),
      ],
    );

    return Object.fromEntries(normalizedEntries);
  }

  return value;
}

async function fetchPsgc<T>(path: string): Promise<T> {
  const cached = cache.get(path);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value as T;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PSGC_API_URL}${path}`, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `PSGC request failed with status ${response.status}.`,
      );
    }

    const parsedValue = (await response.json()) as unknown;
    const value = normalizeLocationNames(parsedValue) as T;

    cache.set(path, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      value,
    });

    return value;
  } finally {
    clearTimeout(timeout);
  }
}

function sendUpstreamError(
  reply: {
    code: (statusCode: number) => {
      send: (payload: object) => unknown;
    };
  },
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : "The Philippine location service is unavailable.";

  return reply.code(502).send({
    message: "Unable to load Philippine location data.",
    error: message,
  });
}

export const locationRoutes: FastifyPluginCallback = (app, _options, done) => {
  app.get("/regions", async (_request, reply) => {
    try {
      return await fetchPsgc<Region[]>("/regions");
    } catch (error) {
      return sendUpstreamError(reply, error);
    }
  });

  app.get<{
    Params: {
      regionCode: string;
    };
  }>("/regions/:regionCode/provinces", async (request, reply) => {
    try {
      const { regionCode } = request.params;

      const provinces = await fetchPsgc<Province[]>(
        `/regions/${encodeURIComponent(regionCode)}/provinces`,
      );

      return provinces;
    } catch (error) {
      return sendUpstreamError(reply, error);
    }
  });

  app.get<{
    Params: {
      regionCode: string;
    };
  }>("/regions/:regionCode/localities", async (request, reply) => {
    try {
      const { regionCode } = request.params;

      return await fetchPsgc<Locality[]>(
        `/regions/${encodeURIComponent(regionCode)}/cities-municipalities`,
      );
    } catch (error) {
      return sendUpstreamError(reply, error);
    }
  });

  app.get<{
    Params: {
      provinceCode: string;
    };
  }>("/provinces/:provinceCode/localities", async (request, reply) => {
    try {
      const { provinceCode } = request.params;

      return await fetchPsgc<Locality[]>(
        `/provinces/${encodeURIComponent(provinceCode)}/cities-municipalities`,
      );
    } catch (error) {
      return sendUpstreamError(reply, error);
    }
  });

  app.get<{
    Params: {
      localityCode: string;
    };
  }>("/localities/:localityCode/barangays", async (request, reply) => {
    try {
      const { localityCode } = request.params;

      return await fetchPsgc<Barangay[]>(
        `/cities-municipalities/${encodeURIComponent(localityCode)}/barangays`,
      );
    } catch (error) {
      return sendUpstreamError(reply, error);
    }
  });

  done();
};