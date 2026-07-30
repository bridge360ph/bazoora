export const assignEcoAideSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["ecoAideId"],
    properties: {
      ecoAideId: {
        type: ["string", "null"],
      },
    },
  },
} as const;