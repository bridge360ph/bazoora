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
      ecoAideId: { type: "string" },
    },
  },
} as const;


export const assignTruckSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  body: {
    type: "object",
    required: ["truckId"],
    properties: {
      truckId: { type: "string" },
    },
  },
} as const;
