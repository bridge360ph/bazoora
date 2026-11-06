export const createHaulingRequestSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: [
      "requestAddress",
      "senderType",
      "wasteType",
      "pickupDate",
    ],
    properties: {
      // Several pickup stops are joined into this one field, so it is capped
      // at both ends (the form allows at most 10 stops of 200 characters).
      requestAddress: {
        type: "string",
        minLength: 5,
        maxLength: 2500,
      },
      // The same stops with their map positions, in the resident's order.
      pickupLocations: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["address", "lat", "lng"],
          properties: {
            address: { type: "string", minLength: 1, maxLength: 500 },
            lat: { type: ["number", "null"], minimum: -90, maximum: 90 },
            lng: { type: ["number", "null"], minimum: -180, maximum: 180 },
          },
        },
      },
      keepStopOrder: {
        type: "boolean",
      },
      senderType: {
        type: "string",
        enum: ["RESIDENT", "BUSINESS"],
      },
      wasteType: {
        type: "string",
        enum: [
          "RESIDUAL",
          "NON_BIODEGRADABLE",
          "HAZARDOUS",
          "BIODEGRADABLE",
        ],
      },
      pickupDate: {
        type: "string",
        format: "date-time",
      },
      // Validated again in the service: only a URL issued by our own
      // presigned upload is stored, anything else becomes null.
      imageUrl: {
        type: "string",
        maxLength: 2048,
      },
      note: {
        type: "string",
        maxLength: 500,
      },
    },
  },
} as const;

export const haulingRequestParamsSchema = {
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
} as const;

export const denyHaulingRequestSchema = {
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
    required: ["denialReason"],
    properties: {
      denialReason: {
        type: "string",
        minLength: 5,
        maxLength: 500,
      },
    },
  },
} as const;

export const haulingRequestPhotoUploadSchema = {
  body: {
    type: "object",
    required: ["fileType"],
    properties: {
      fileName: {
        type: "string",
        maxLength: 255,
      },
      fileType: {
        type: "string",
        maxLength: 100,
      },
    },
  },
} as const;

export const assignHaulingRequestRouteSchema = {
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
    required: ["routeId"],
    properties: {
      routeId: {
        type: ["string", "null"],
      },
    },
  },
} as const;

export const createPaidHaulingRouteSchema = {
  body: {
    type: "object",
    additionalProperties: false,
    required: [
      "requestId",
      "truckId",
      "name",
      "barangay",
      "collectionDate",
      "startTime",
      "stopLocations",
    ],
    properties: {
      requestId: { type: "string", minLength: 1 },
      truckId: { type: "string", minLength: 1 },
      name: { type: "string", minLength: 5, maxLength: 100 },
      barangay: { type: "string", minLength: 5, maxLength: 200 },
      collectionDate: {
        type: "string",
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      },
      startTime: {
        type: "string",
        pattern: "^\\d{1,2}:\\d{2}",
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
