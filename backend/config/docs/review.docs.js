// OpenAPI documentation fragment for Reviews routes.
// Migrated out of backend/routes/review.routes.js @swagger JSDoc blocks.

const reviewDocs = {
  tags: [
    {
      name: "Reviews",
      description:
        "Customer feedback systems, star rating aggregations, and restaurant review matrices",
    },
  ],
  paths: {
    "/api/reviews": {
      post: {
        summary: "Submit a new customer rating and review",
        description:
          "Persists a single review entry and triggers a reactive calculation layer to update the target restaurant's primary rating footprint in real time.",
        tags: ["Reviews"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["restaurantId", "customerId", "rating"],
                properties: {
                  restaurantId: {
                    type: "string",
                    description:
                      "Unique 24-character hex ID of the target restaurant document",
                    example: "65cb1a8b9f1d2c001f4a5678",
                  },
                  customerId: {
                    type: "string",
                    description:
                      "Unique 24-character hex ID of the reviewing customer",
                    example: "65cb1a8b9f1d2c001f4a5111",
                  },
                  customerName: {
                    type: "string",
                    description: "Display name of the customer profile",
                    example: "Aarshi Chanda",
                  },
                  rating: {
                    type: "number",
                    minimum: 1,
                    maximum: 5,
                    description:
                      "Numeric star value assigned by the user (1 to 5 stars)",
                    example: 5,
                  },
                  comment: {
                    type: "string",
                    description:
                      "Explicit text review description written by the customer",
                    example:
                      "Absolutely delicious food! The presentation was clean and delivery was exceptionally fast.",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "Review submitted successfully and aggregate analytics recalculated.",
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
                      example:
                        "Review submitted and restaurant aggregate rating updated successfully!",
                    },
                    updatedRestaurantRating: {
                      type: "number",
                      example: 4.5,
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Bad request - Missing mandatory values or user already has a pending evaluation profile",
          },
          500: {
            description: "Internal runtime server fault",
          },
        },
      },
    },
    "/api/reviews/restaurant/{restaurantId}": {
      get: {
        summary: "Fetch all verified customer reviews for a given restaurant",
        description:
          "Publicly streams chronological review logs, comments, and star distributions for a target kitchen.",
        tags: ["Reviews"],
        parameters: [
          {
            in: "path",
            name: "restaurantId",
            required: true,
            schema: {
              type: "string",
            },
            description:
              "Unique 24-character hexadecimal MongoDB ObjectId of the target restaurant",
            example: "65cb1a8b9f1d2c001f4a5678",
          },
        ],
        responses: {
          200: {
            description:
              "Complete history of restaurant review documents fetched successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    count: {
                      type: "integer",
                      example: 1,
                    },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                      },
                    },
                  },
                },
              },
            },
          },
          500: {
            description:
              "Internal server error while retrieving data feed.",
          },
        },
      },
    },
  },
};

export default reviewDocs;
