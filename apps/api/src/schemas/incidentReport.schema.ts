const incidentStatuses = [
  "PENDING",
  "INVESTIGATING",
  "RESOLVED",
  "DENIED",
] as const;

export const listIncidentReportsSchema = {
  querystring: {
    type: "object",
    additionalProperties: false,
    properties: {
      status: {
        type: "string",
        enum: incidentStatuses,
      },
      category: {
        type: "string",
        maxLength: 100,
      },
    },
  },
} as const;

export const updateIncidentReportSchema = {
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
    minProperties: 1,
    properties: {
      status: {
        type: "string",
        enum: incidentStatuses,
      },
      adminNotes: {
        type: "string",
        maxLength: 1000,
      },
    },
  },
} as const;
