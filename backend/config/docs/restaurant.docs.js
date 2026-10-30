// OpenAPI documentation fragment for Restaurants routes.
// Migrated out of backend/routes/restaurant.routes.js @swagger JSDoc blocks.

const restaurantDocs = {
  tags: [
    {
      name: "Restaurants",
      description:
        "Public restaurant discovery engines, search filters, and menus streaming catalogs",
    },
  ],
  paths: {
    "/api/restaurants": {
      get: {
        summary: "Discover restaurants and search menu dishes",
        description:
          "Fetches all active restaurants. Supports query parameters for searching matching kitchens or menu dishes.",
        tags: ["Restaurants"],
        parameters: [
          {
            in: "query",
            name: "search",
            schema: {
              type: "string",
            },
            description:
              "Keyword to match restaurant name, cuisine type, or specific dishes on the menu",
            example: "Pizza",
          },
        ],
        responses: {
          200: {
            description: "List of active restaurants retrieved successfully.",
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
                    restaurants: {
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
            description: "Internal server error while fetching restaurants.",
          },
        },
      },
    },
    "/api/restaurants/{id}": {
      get: {
        summary:
          "Fetch structured detail fields and the menu for a single restaurant",
        description:
          "Pulls a comprehensive profile layout including categories, dishes, prices, availability states, and info context for a single restaurant by its ID.",
        tags: ["Restaurants"],
        parameters: [
          {
            in: "path",
            name: "id",
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
              "Granular restaurant document and menu items fetched successfully.",
          },
          400: {
            description: "Invalid restaurant ID schema format.",
          },
          404: {
            description: "Target restaurant not found or is currently inactive.",
          },
          500: {
            description: "Internal server runtime error.",
          },
        },
      },
    },
  },
};

export default restaurantDocs;
