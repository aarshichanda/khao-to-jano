// OpenAPI documentation fragment for Coupons routes.
// Migrated out of backend/routes/coupon.routes.js @swagger JSDoc blocks.

const couponDocs = {
  tags: [
    {
      name: "Coupons",
      description:
        "Promotional discount checking engines and coupon code calculations",
    },
  ],
  paths: {
    "/api/coupons/validate": {
      post: {
        summary: "Validate a promotional coupon code and calculate savings",
        description:
          "Sanitizes input strings, verifies active constraints, evaluates minimum order amounts, and computes dynamic flat or percentage discounts cleanly.",
        tags: ["Coupons"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["couponCode", "orderTotal"],
                properties: {
                  couponCode: {
                    type: "string",
                    description:
                      "Case-insensitive promotional coupon code string",
                    example: "FIRST50",
                  },
                  orderTotal: {
                    type: "number",
                    description:
                      "Total subtotal numeric amount of the active cart items",
                    example: 350,
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Coupon verified successfully. Returns computed absolute discount value.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    discountAmount: {
                      type: "number",
                      example: 35,
                    },
                    message: {
                      type: "string",
                      example: "Coupon 'FIRST50' applied successfully!",
                    },
                  },
                },
              },
            },
          },
          400: {
            description:
              "Bad request - Missing code strings, inactive status, or cart subtotal falls short of minimum prerequisites",
          },
          404: {
            description: "Coupon target pattern not found in database records",
          },
          500: {
            description: "Internal runtime server fault",
          },
        },
      },
    },
  },
};

export default couponDocs;
