export const createHaulingRequestSchema = {
  body: {
    type: "object",
    required: [
      "requestAddress",
      "senderType",
      "pickupDate",
    ],
    properties: {
      requestAddress: {
        type: "string",
      },
      senderType: {
        type: "string",
      },
      pickupDate: {
        type: "string",
      },
      imageUrl: {
        type: "string",
      },
      note: {
        type: "string",
      },
    },
  },
} as const;

export const haulingRequestParamsSchema = {
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