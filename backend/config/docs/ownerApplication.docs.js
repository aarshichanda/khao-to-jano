// OpenAPI documentation fragment for Owner Applications routes.
// Migrated out of backend/routes/ownerApplication.routes.js @swagger JSDoc blocks.

const ownerApplicationDocs = {
  tags: [
    {
      name: "Owner Applications",
      description:
        "Onboarding management for new restaurant owners and administrative review dashboards",
    },
  ],
  paths: {
    "/api/owner-applications": {
      post: {
        summary:
          "Publicly submit a new restaurant-owner onboarding application",
        description:
          "Accepts onboarding parameters for verification. Enforces maximum character limits and prevents redundant submissions for pending emails.",
        tags: ["Owner Applications"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "applicantName",
                  "email",
                  "phone",
                  "restaurantName",
                  "restaurantAddress",
                ],
                properties: {
                  applicantName: {
                    type: "string",
                    example: "Aarshi Chanda",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "owner@khaokitchen.com",
                  },
                  phone: {
                    type: "string",
                    example: "9876543210",
                  },
                  restaurantName: {
                    type: "string",
                    example: "Khao To Jano Corporate Kitchen",
                  },
                  restaurantAddress: {
                    type: "string",
                    example: "Sector V, Salt Lake, Kolkata",
                  },
                  cuisine: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    example: ["North Indian", "Bengali", "Mughlai"],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Application submitted successfully for admin review.",
          },
          400: {
            description:
              "Missing mandatory parameter parameters or fields exceed allowed length.",
          },
          409: {
            description:
              "Duplicate application detected with an identical active pending profile state.",
          },
          500: {
            description: "Internal server error.",
          },
        },
      },
      get: {
        summary: "List all onboarding applications (Admin Only)",
        description:
          "Returns a complete history log sorted by most recent date. Automatically removes tokens from search results to preserve data security. Requires an admin token.",
        tags: ["Owner Applications"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Applications list fetched successfully.",
          },
          401: {
            description: "Unauthorized - Valid token missing.",
          },
          403: {
            description: "Forbidden - Requires administrator rights.",
          },
          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/owner-applications/available-existing-restaurants": {
      get: {
        summary:
          "Fetch active unowned restaurants not already reserved (Admin Only)",
        description:
          "Lists available unowned restaurants to assign to incoming candidate applicants. Requires an admin token.",
        tags: ["Owner Applications"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description:
              "Available unowned restaurant entities filtered successfully.",
          },
          401: {
            description: "Unauthorized access.",
          },
          403: {
            description: "Forbidden admin context.",
          },
          500: {
            description: "Internal server breakdown.",
          },
        },
      },
    },
    "/api/owner-applications/{id}/assign-existing": {
      patch: {
        summary:
          "Link an active unowned restaurant to a pending application (Admin Only)",
        description:
          "Maps an unowned restaurant record directly onto a target application. Requires an admin token.",
        tags: ["Owner Applications"],
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
              "MongoDB ObjectId of the pending owner application record",
            example: "65cc2b9c8e1f3a002b5c1111",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["restaurantId"],
                properties: {
                  restaurantId: {
                    type: "string",
                    description:
                      "MongoDB ObjectId of the target unowned restaurant record",
                    example: "65cb1a8b9f1d2c001f4a5678",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Restaurant link assigned smoothly.",
          },
          400: {
            description: "Invalid syntax parameters format.",
          },
          404: {
            description: "Application file context missing.",
          },
          409: {
            description:
              "Conflict - Target restaurant is already assigned to a different application.",
          },
          500: {
            description: "Internal server error.",
          },
        },
      },
    },
    "/api/owner-applications/{id}/approve": {
      patch: {
        summary:
          "Approve onboarding applications and generate verification email signals (Admin Only)",
        description:
          "Validates mapping criteria, updates application status flags, creates new blank restaurant assets if needed, and issues secure 24-hour verification emails to applicants. Requires an admin token.",
        tags: ["Owner Applications"],
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
              "MongoDB ObjectId of the pending owner application record",
            example: "65cc2b9c8e1f3a002b5c1111",
          },
        ],
        responses: {
          200: {
            description:
              "Application approved. Activation links sent out via mailing nodes.",
          },
          400: {
            description: "Invalid ObjectId structure parameters.",
          },
          404: {
            description: "Target documentation entity missing.",
          },
          409: {
            description:
              "Application status is not pending or targeted assets are no longer available.",
          },
          500: {
            description:
              "Internal engine or connection fault while shipping secure emails.",
          },
        },
      },
    },
    "/api/owner-applications/{id}/reject": {
      patch: {
        summary: "Reject a pending onboarding application (Admin Only)",
        description:
          "Flags an active pending submission record as rejected. Requires an admin token.",
        tags: ["Owner Applications"],
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
              "MongoDB ObjectId of the pending owner application record",
            example: "65cc2b9c8e1f3a002b5c1111",
          },
        ],
        responses: {
          200: {
            description:
              "Onboarding application flagged rejected successfully.",
          },
          400: {
            description: "Malformed identification syntax parameters.",
          },
          404: {
            description: "Record reference target missing.",
          },
          409: {
            description: "Conflict - Target application status is not pending.",
          },
          500: {
            description: "Internal server fault.",
          },
        },
      },
    },
  },
};

export default ownerApplicationDocs;
