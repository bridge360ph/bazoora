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
      },
      collectionDay: {
        type: "string",
      },
      startTime: {
        type: "string",
      },
      routeType: {
        type: "string",
      },
    },
  },
} as const;


export const updateRouteSchema = {
  body: {
    type: "object",
    properties: {
      status: {
        type: "string",
      },
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
      },
      collectionDay: {
        type: "string",
      },
      startTime: {
        type: "string",
      },
      routeType: {
        type: "string",
        minLength: 3,
    },
    },
  },
} as const;