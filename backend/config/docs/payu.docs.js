// OpenAPI documentation fragment for PayU Payments routes.
// Migrated out of backend/routes/payu.routes.js @swagger JSDoc blocks.

const payuDocs = {
  tags: [
    {
      name: "PayU Payments",
      description:
        "Online merchant transaction pipelines, cryptographic hash validations, and webhook hooks callbacks",
    },
  ],
  paths: {
    "/api/payu/initiate": {
      post: {
        summary: "Initiate a secure PayU transaction session token",
        description:
          "Aggregates subtotal values, validates configuration keys, handles pricing validations, and computes secure transaction hash keys. Requires customer bearer token authorization signatures.",
        tags: ["PayU Payments"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["checkoutId"],
                properties: {
                  checkoutId: {
                    type: "string",
                    description:
                      "Unique basket tracking reference key parameters string",
                    example: "KTJ-CHECKOUT-88192",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Cryptographic checkout session payload prepared smoothly.",
          },
          400: {
            description:
              "Bad request - Missing target identifiers or order total amounts evaluate invalid indices.",
          },
          404: {
            description:
              "Not Found - Matching active checkout transaction record missing.",
          },
          500: {
            description: "Internal server fault.",
          },
        },
      },
    },
    "/api/payu/callback": {
      post: {
        summary:
          "Receive and decode incoming merchant callback post signals from PayU",
        description:
          "Decodes incoming URL-encoded payment data, verifies the signature using the merchant salt, checks amounts, and updates the database order status. Redirects back to the React orders dashboard.",
        tags: ["PayU Payments"],
        responses: {
          200: {
            description:
              "Transaction record processed and customer rerouted back safely.",
          },
          400: {
            description:
              "Bad Request - Verification hash signature mismatch or data field attributes corrupt.",
          },
          404: {
            description:
              "Not Found - Transaction identifier tracking key mapping record missing.",
          },
          500: {
            description: "Internal runtime callback parsing fault.",
          },
        },
      },
    },
  },
};

export default payuDocs;
