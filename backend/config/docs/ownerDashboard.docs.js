// OpenAPI documentation fragment for Owner Dashboard & Operations routes.
// Migrated out of backend/routes/ownerDashboard.routes.js @swagger JSDoc blocks.

const ownerDashboardDocs = {
  tags: [
    {
      name: "Owner Dashboard & Operations",
      description:
        "Restaurant metrics dashboard tracking, historical order management, and workflow status operations",
    },
  ],
  paths: {
    "/api/owner/dashboard": {
      get: {
        summary:
          "Retrieve real-time sales revenue metrics and counts (Owner Only)",
        description:
          "Computes total active checkout orders, accumulates today's revenue calculations, and checks total historical volume constraints. Requires a restaurant owner bearer token.",
        tags: ["Owner Dashboard & Operations"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard summary metrics loaded successfully.",
          },
          403: {
            description:
              "Forbidden - Requires a restaurant_owner profile signature.",
          },
          404: {
            description: "Not Found - Active restaurant mapping target missing.",
          },
          500: {
            description: "Internal runtime breakdown.",
          },
        },
      },
    },
    "/api/owner/orders": {
      get: {
        summary:
          "Fetch latest historical orders received by this restaurant (Owner Only)",
        description:
          "Streams incoming order documents matching this business profile, sorted by date descending up to a maximum limit of 100 entries. Requires a restaurant owner bearer token.",
        tags: ["Owner Dashboard & Operations"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "History logs fetched cleanly.",
          },
          403: {
            description: "Forbidden - Owner credentials missing.",
          },
          404: {
            description: "Active restaurant entity missing.",
          },
          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/owner/orders/{id}/status": {
      patch: {
        summary:
          "Update an order status through permitted tracking sequences (Owner Only)",
        description:
          "Transitions order states sequentially (e.g., PLACED to RESTAURANT_ACCEPTED or CANCELLED, READY to OUT_FOR_DELIVERY) and fires Socket.io notifications to all active dashboard channels. Requires a restaurant owner bearer token.",
        tags: ["Owner Dashboard & Operations"],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: {
              type: "string",
            },
            description:
              "Unique 24-character hexadecimal MongoDB ObjectId of the target order record",
            example: "65cc2b9c8e1f3a002b5c6789",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderStatus"],
                properties: {
                  orderStatus: {
                    type: "string",
                    enum: [
                      "RESTAURANT_ACCEPTED",
                      "CANCELLED",
                      "PREPARING",
                      "READY",
                      "OUT_FOR_DELIVERY",
                      "DELIVERED",
                    ],
                    example: "RESTAURANT_ACCEPTED",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Step transition applied successfully and event signals routed.",
          },
          400: {
            description:
              "Malformed syntax parameter or illegal transition rule violation.",
          },
          403: {
            description: "Forbidden profile contextual permission.",
          },
          404: {
            description:
              "Target order document not found under this business profile space.",
          },
          500: {
            description: "Internal validation pipeline runtime failure.",
          },
        },
      },
    },
  },
};

export default ownerDashboardDocs;
