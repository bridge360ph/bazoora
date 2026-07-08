export const createHaulingRequestSchema = {
  body: {
    type: "object",
    required: [
      "userId",
      "orgId",
      "requestAddress",
      "senderType",
      "pickupDate",
    ],
    properties: {
      userId: {
        type: "string",
      },

      orgId: {
        type: "string",
      },

      requestAddress: {
        type: "string",
      },

      senderType: {
        type: "string",
        enum: [
          "Business",
          "Resident",
        ],
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