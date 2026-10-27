import "dotenv/config";

// Drives a truck along a path and posts its location to the API, the same
// way the driver app does. Residents and eco-aides watching the map get the
// updates over the socket, so live tracking can be tested without anyone
// physically moving a phone.
//
// Usage (from apps/api):
//   SIM_EMAIL=driver@bazoora.com SIM_PASSWORD=... pnpm simulate:truck
//
// The account must be the truck's assigned driver, or the eco-aide on the
// route the truck is assigned to. Stop the simulation with Ctrl+C.

if (process.env.NODE_ENV !== "development") {
  throw new Error(
    "Truck simulation aborted: NODE_ENV must be explicitly set to 'development'.",
  );
}

type LatLng = [number, number];

function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

interface PlannedStop {
  lat: number;
  lng: number;
}

interface MyTruck {
  id: string;
  plateNumber: string;
  currentLocation: { lat: number; lng: number } | null;
  plannedRoute: PlannedStop[];
}

const apiUrl = (
  process.env.SIM_API_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`
).replace(/\/$/, "");
const email = process.env.SIM_EMAIL?.trim() ?? "";
const password = process.env.SIM_PASSWORD ?? "";
const intervalMs = Number(process.env.SIM_INTERVAL_MS ?? 2000);
const stepMeters = Number(process.env.SIM_STEP_METERS ?? 15);

if (!email || !password) {
  throw new Error(
    "SIM_EMAIL and SIM_PASSWORD are required. Use the truck's assigned driver or eco-aide account.",
  );
}

if (!Number.isFinite(intervalMs) || intervalMs < 250) {
  throw new Error("SIM_INTERVAL_MS must be a number of at least 250.");
}

if (!Number.isFinite(stepMeters) || stepMeters <= 0) {
  throw new Error("SIM_STEP_METERS must be a positive number.");
}

// Used only when the truck has no planned route and no last known location.
const DEFAULT_CENTER: LatLng = [14.3833, 120.8833];

function parseCenter(value: string | undefined): LatLng {
  if (!value) {
    return DEFAULT_CENTER;
  }

  const [lat, lng] = value.split(",").map((part) => Number(part.trim()));

  if (lat === undefined || lng === undefined || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("SIM_CENTER must look like '14.3833,120.8833'.");
  }

  return [lat, lng];
}

let accessToken = "";

async function login(): Promise<void> {
  const response = await fetch(`${apiUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const json = (await response.json()) as {
    success?: boolean;
    data?: { accessToken?: string; user?: { role?: string } };
    error?: string;
  };

  if (!response.ok || !json.data?.accessToken) {
    throw new Error(`Login failed: ${json.error ?? response.statusText}`);
  }

  accessToken = json.data.accessToken;
  log(`Signed in as ${email} (${json.data.user?.role ?? "unknown role"}).`);
}

// Access tokens are short-lived, so sign in again once if one expires
// during a long simulation.
async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = () =>
    fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

  const response = await send();

  if (response.status !== 401) {
    return response;
  }

  await login();
  return send();
}

async function getMyTruck(): Promise<MyTruck> {
  const response = await authorizedFetch("/trucks/me");
  const json = (await response.json()) as { data?: MyTruck; error?: string };

  if (!response.ok || !json.data) {
    throw new Error(`Could not load the assigned truck: ${json.error ?? response.statusText}`);
  }

  return json.data;
}

// A square loop of about 400 m per side, so the truck visibly moves around
// a neighbourhood when there is no planned route to follow.
function loopAround([lat, lng]: LatLng): LatLng[] {
  const d = 0.0018;
  return [
    [lat, lng],
    [lat + d, lng],
    [lat + d, lng + d],
    [lat, lng + d],
    [lat, lng],
  ];
}

function buildWaypoints(truck: MyTruck): LatLng[] {
  const stops = truck.plannedRoute.filter(
    (stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng),
  );

  if (stops.length >= 2) {
    log(`Following the planned route (${stops.length} stops).`);
    return stops.map((stop): LatLng => [stop.lat, stop.lng]);
  }

  const start: LatLng = truck.currentLocation
    ? [truck.currentLocation.lat, truck.currentLocation.lng]
    : parseCenter(process.env.SIM_CENTER);

  log(
    `No planned route found. Looping around ${start[0].toFixed(5)}, ${start[1].toFixed(5)}.`,
  );
  return loopAround(start);
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function bearingDegrees(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const y = Math.sin(toRad(b[1] - a[1])) * Math.cos(toRad(b[0]));
  const x =
    Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) -
    Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(toRad(b[1] - a[1]));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Splits each leg into points about stepMeters apart. Straight lines between
// stops are enough for testing; they are not snapped to roads.
function interpolate(waypoints: LatLng[]): LatLng[] {
  const points: LatLng[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];

    if (!from || !to) {
      continue;
    }

    const steps = Math.max(1, Math.ceil(distanceMeters(from, to) / stepMeters));

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      points.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
    }
  }

  const last = waypoints[waypoints.length - 1];
  if (last) {
    points.push(last);
  }

  return points;
}

async function postLocation(truckId: string, point: LatLng, heading: number): Promise<void> {
  const response = await authorizedFetch(`/trucks/${truckId}/location`, {
    method: "POST",
    body: JSON.stringify({
      lat: point[0],
      lng: point[1],
      heading,
      speed: stepMeters / (intervalMs / 1000),
      timestamp: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(`Location update rejected: ${json.error ?? response.statusText}`);
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

let running = true;

process.on("SIGINT", () => {
  log("\nStopping simulation.");
  running = false;
});

await login();
const truck = await getMyTruck();
log(`Simulating truck ${truck.plateNumber} (${truck.id}). Press Ctrl+C to stop.`);

const path = interpolate(buildWaypoints(truck));
let index = 0;
let direction = 1;

while (running) {
  const point = path[index];
  const next = path[index + direction] ?? path[index - direction];

  if (point) {
    const heading = next ? bearingDegrees(point, next) : 0;
    await postLocation(truck.id, point, heading);
    log(
      `[${new Date().toLocaleTimeString()}] ${point[0].toFixed(6)}, ${point[1].toFixed(6)}`,
    );
  }

  // Drive back along the same path at either end so the truck keeps moving.
  if (index + direction >= path.length || index + direction < 0) {
    direction *= -1;
  }
  index += direction;

  await sleep(intervalMs);
}

log(
  "Simulation stopped. The truck stays marked active until its route is finished in the driver app.",
);
