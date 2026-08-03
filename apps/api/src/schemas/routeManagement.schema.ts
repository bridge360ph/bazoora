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

export interface CreateRouteBody {
  name: string;
  barangay: string;
  waypoints: string;
  wasteType: string;
  collectionDay: string;
  startTime: string;
  routeType: string;
}

export interface UpdateRouteBody {
  name?: string;
  barangay?: string;
  waypoints?: string;
  wasteType?: string;
  collectionDay?: string;
  startTime?: string;
  routeType?: string;
  status?: string;
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
      },
      collectionDay: {
        type: "string",
      },
      startTime: {
        type: "string",
      },
    },
  },
} as const;

export const updateRouteSchema = {
  params: {
    type: "object",
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
      },
      collectionDay: {
        type: "string",
      },
      startTime: {
        type: "string",
      },
    },
  },
} as const;

  export const updateRouteStatusSchema = {
    params: {
      type: "object",
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