// OpenAPI documentation fragment for Owner Management routes.
// Migrated out of backend/routes/owner.routes.js @swagger JSDoc blocks.

const ownerDocs = {
  tags: [
    {
      name: "Owner Management",
      description:
        "Onboarding verification metrics and initial restaurant profile mapping keys",
    },
  ],
  paths: {
    "/api/owner/link-restaurant": {
      post: {
        summary:
          "Verify and confirm the structural restaurant link for an activated owner",
        description:
          "Cross-checks approved registration logs to prevent duplicate kitchen profile allocation anomalies. Requires an active owner bearer token.",
        tags: ["Owner Management"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              "Restaurant link confirmed and active data structure fetched successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    message: {
                      type: "string",
                      example: "Restaurant is already linked to this owner.",
                    },
                    data: {
                      type: "object",
                      properties: {
                        restaurantId: {
                          type: "string",
                          example: "65cb1a8b9f1d2c001f4a5678",
                        },
                        name: {
                          type: "string",
                          example: "Khao To Jano Corporate Kitchen",
                        },
                        address: {
                          type: "string",
                          example: "Sector V, Salt Lake, Kolkata",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          403: {
            description:
              "Forbidden - Requires restaurant_owner role permissions.",
          },
          404: {
            description:
              "Not Found - No activated restaurant profile mapped to this email identity.",
          },
          409: {
            description:
              "Conflict - Target restaurant asset is already owned or configuration is mismatching.",
          },
          500: {
            description: "Internal server validation failure.",
          },
        },
      },
    },
  },
};

export default ownerDocs;
