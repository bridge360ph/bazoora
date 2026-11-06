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
