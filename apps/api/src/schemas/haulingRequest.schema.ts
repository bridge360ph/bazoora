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
      requestAddress: {
        type: "string",
        minLength: 5,
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
      imageUrl: {
        type: "string",
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