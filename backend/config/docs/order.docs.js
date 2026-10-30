// OpenAPI documentation fragment for Orders routes.
// Migrated out of backend/routes/order.routes.js @swagger JSDoc blocks.

const orderDocs = {
  tags: [
    {
      name: "Orders",
      description:
        "Customer checkout engines, order tracking workflows, and multi-restaurant transaction models",
    },
  ],
  paths: {
    "/api/orders": {
      post: {
        summary:
          "Create new food marketplace orders (Supports multi-restaurant checkouts)",
        description:
          "Instantiates and processes cart selections. For 'COD', Socket.IO triggers are immediately fired to restaurant owners. For 'ONLINE', orders pause in 'PENDING' state until external webhook verification passes. Requires a bearer token.",
        tags: ["Orders"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["deliveryAddress", "phone", "paymentMethod"],
                properties: {
                  restaurant: {
                    type: "string",
                    description:
                      "Main target restaurant ObjectId (Used for single restaurant checkout format)",
                    example: "65cb1a8b9f1d2c001f4a5678",
                  },
                  items: {
                    type: "array",
                    description:
                      "Cart selections for the single restaurant format",
                    items: {
                      type: "object",
                      properties: {
                        dishId: {
                          type: "string",
                          example: "65cb1a8b9f1d2c001f4a5699",
                        },
                        quantity: {
                          type: "integer",
                          example: 2,
                        },
                      },
                    },
                  },
                  restaurants: {
                    type: "array",
                    description:
                      "Advanced multi-restaurant structure (Overrides single fields if provided)",
                    items: {
                      type: "object",
                      properties: {
                        restaurant: {
                          type: "string",
                          example: "65cb1a8b9f1d2c001f4a5678",
                        },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              dishId: {
                                type: "string",
                                example: "65cb1a8b9f1d2c001f4a5699",
                              },
                              quantity: {
                                type: "integer",
                                example: 2,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  deliveryAddress: {
                    type: "object",
                    required: ["street", "city", "state", "postalCode"],
                    properties: {
                      street: {
                        type: "string",
                        example: "12, Park Street, Flat 3B",
                      },
                      city: {
                        type: "string",
                        example: "Kolkata",
                      },
                      state: {
                        type: "string",
                        example: "West Bengal",
                      },
                      postalCode: {
                        type: "string",
                        example: "700016",
                      },
                    },
                  },
                  phone: {
                    type: "string",
                    example: "+919830012345",
                  },
                  paymentMethod: {
                    type: "string",
                    enum: ["COD", "ONLINE"],
                    example: "COD",
                  },
                  couponCode: {
                    type: "string",
                    description:
                      "Optional coupon code to apply. Supported codes include 'FIRST50'.",
                    example: "FIRST50",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description:
              "Checkout structure created successfully. Returns combined order details.",
          },
          400: {
            description:
              "Bad request - Missing target identifiers, unavailable dishes, or malformed payloads",
          },
          401: {
            description:
              "Unauthorized - Authentication token missing or user profile invalid",
          },
          404: {
            description: "Target restaurant not found or currently inactive",
          },
          500: {
            description: "Internal runtime server fault",
          },
        },
      },
      get: {
        summary:
          "Retrieve history of orders belonging to the authenticated customer",
        description:
          "Fetches all platform orders matching the caller's secure identity footprint, sorted descending by compilation date. Requires a bearer token.",
        tags: ["Orders"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "History log fetched successfully",
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
                    orders: {
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
          401: {
            description: "Unauthorized - Bearer verification failed",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/api/orders/{id}": {
      get: {
        summary:
          "Fetch granular tracking metrics for a single explicit customer order",
        description:
          "Restricts access dynamically, ensuring clients can only pull metrics for records they personally placed. Requires a bearer token.",
        tags: ["Orders"],
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
        responses: {
          200: {
            description: "Granular order object retrieved successfully",
          },
          400: {
            description: "Invalid order ID syntax structure",
          },
          401: {
            description: "Unauthorized - Bearer token tracking failed",
          },
          404: {
            description:
              "Target order document not found for this client profile",
          },
          500: {
            description: "Internal runtime engine crash",
          },
        },
      },
    },
  },
};

export default orderDocs;
