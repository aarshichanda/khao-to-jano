// OpenAPI documentation fragment for Admin routes.
// Migrated out of backend/routes/admin.routes.js @swagger JSDoc blocks.

const adminDocs = {
  tags: [
    {
      name: "Admin",
      description:
        "Global administrator controls for marketplace order overrides and platform monitoring",
    },
  ],
  paths: {
    "/api/admin/orders": {
      get: {
        summary:
          "Fetch all marketplace orders across all restaurants (Admin Only)",
        description:
          "Retrieves the global order history log sorted by most recent first, populating user profiles and restaurant profiles. Requires an admin token.",
        tags: ["Admin"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Marketplace order stream fetched successfully.",
          },
          401: {
            description: "Unauthorized - Valid token missing.",
          },
          403: {
            description: "Forbidden - Requires admin privileges.",
          },
          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/admin/orders/{id}/status": {
      patch: {
        summary:
          "Override and update an order status to confirmed or cancelled (Admin Only)",
        description:
          "Updates a restaurant-accepted order to CONFIRMED or CANCELLED, then pushes real-time updates via Socket.io to admins, customers, and restaurant owners. Requires an admin token.",
        tags: ["Admin"],
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
              "Unique 24-character hexadecimal MongoDB ObjectId of the target order",
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
                    enum: ["CONFIRMED", "CANCELLED"],
                    example: "CONFIRMED",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Order status updated successfully and real-time sockets dispatched.",
          },
          400: {
            description:
              "Invalid order ID syntax or illegal target status provided.",
          },
          401: {
            description: "Unauthorized.",
          },
          403: {
            description: "Forbidden admin context.",
          },
          404: {
            description: "Target order document not found.",
          },
          409: {
            description:
              "Conflict - The restaurant must accept the order before admin can alter it.",
          },
          500: {
            description: "Internal server processing error.",
          },
        },
      },
    },
  },
};

export default adminDocs;
