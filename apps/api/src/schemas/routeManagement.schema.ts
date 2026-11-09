export const routeManagementParamsSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
      },
    },
  },
} as const;

import type { RouteStopLocation } from "@bazoora/shared";

export interface CreateRouteBody {
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  routeType: string;
  // Optional to match the schema, which does not list it as required.
  assignedEcoAideId?: string | null;
  stopLocations?: RouteStopLocation[];
  collectionDate?: string | null;
}

export interface UpdateRouteBody {
  name?: string;
  barangay?: string;
  waypoints?: string;
  wasteType?: string;
  collectionDay?: string;
  startTime?: string;
  routeType?: string;
  assignedEcoAideId?: string | null;
  stopLocations?: RouteStopLocation[];
  collectionDate?: string | null;
}

export const createRouteSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: [
      "name",
      "barangay",
      "waypoints",
      "wasteType",
      "collectionDay",
      "startTime",
      "routeType",
    ],
    properties: {
      name: {
        type: "string",
      },
      barangay: {
        type: "string",
      },
      waypoints: {
        type: "string",
      },
      wasteType: {
        type: "string",
        enum: ["BIODEGRADABLE", "RESIDUAL", "NON_BIODEGRADABLE", "HAZARDOUS"],
      },
      collectionDay: {
        type: "string",
      },
      startTime: {
        type: "string",
      },
      routeType: {
        type: "string",
        enum: ["Free", "Paid"],
      },
      collectionDate: {
        type: ["string", "null"],
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
      assignedEcoAideId: {
        type: ["string", "null"],
      },
      stopLocations: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "address", "lat", "lng"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            address: { type: "string", maxLength: 500 },
            lat: { type: "number", minimum: -90, maximum: 90 },
            lng: { type: "number", minimum: -180, maximum: 180 },
          },
        },
      },
    },
  },
} as const;


export const updateRouteSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: {
        type: "string",
        minLength: 5,
      },
      barangay: {
        type: "string",
        minLength: 5,
      },
      waypoints: {
        type: "string",
        minLength: 5,
      },
      wasteType: {
        type: "string",
        enum: ["BIODEGRADABLE", "RESIDUAL", "NON_BIODEGRADABLE", "HAZARDOUS"],
      },
      collectionDay: {
        type: "string",
      },
      startTime: {
        type: "string",
      },
      assignedEcoAideId: {
        type: ["string", "null"],
      },
      stopLocations: {
        type: "array",
        minItems: 1,
        maxItems: 50,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "address", "lat", "lng"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 200 },
            address: { type: "string", maxLength: 500 },
            lat: { type: "number", minimum: -90, maximum: 90 },
            lng: { type: "number", minimum: -180, maximum: 180 },
          },
        },
      },
      routeType: {
        type: "string",
        enum: ["Free", "Paid"],
      },
      collectionDate: {
        type: ["string", "null"],
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
    },
  },
} as const;


export const updateRouteStatusSchema = {
  params: {
    type: "object",
    additionalProperties: false,
    required: ["id"],
    properties: {
      id: {
        type: "string",
      },
    },
  },
  body: {
    type: "object",
    additionalProperties: false,
    required: ["status"],
    properties: {
      status: {
        type: "string",
        enum: [
          "Not Started",
          "In Progress",
          "Completed",
        ],
      },
    },
  },
} as const;
