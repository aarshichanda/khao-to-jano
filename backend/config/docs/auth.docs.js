// OpenAPI documentation fragment for Authentication routes.
// Migrated out of backend/routes/auth.routes.js @swagger JSDoc blocks.

const authDocs = {
  tags: [
    {
      name: "Authentication",
      description:
        "Platform identity management, authorization workflows, and role activations",
    },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Register a new customer account",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: {
                    type: "string",
                    example: "Aarshi Chanda",
                  },
                  username: {
                    type: "string",
                    example: "aarshi90",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    example: "aarshi@gmail.com",
                  },
                  phone: {
                    type: "string",
                    example: "9876543210",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "SecurePass123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Customer account created successfully",
          },
          400: {
            description: "Missing fields or password too short",
          },
          409: {
            description: "Conflict - Email already registered",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Authenticate customer or restaurant owner",
        description:
          "Supports logging in via email for customers, or loginUsername for approved restaurant owners.",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: {
                  identifier: {
                    type: "string",
                    description: "Can be email or loginUsername",
                    example: "aarshi@gmail.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    example: "SecurePass123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Authentication successful, authorization token returned",
          },
          400: {
            description: "Missing identifier or password",
          },
          401: {
            description: "Unauthorized - Invalid username/email or password",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        summary: "Request a password reset link email",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    example: "aarshi@gmail.com",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Safe status returned regardless of email existence to prevent user enumeration",
          },
          400: {
            description: "Bad request - Email missing",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/api/auth/reset-password": {
      post: {
        summary: "Reset account password using secure token",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: {
                  token: {
                    type: "string",
                    description: "SHA256 hashed signature sent to user email",
                    example: "3c6b2...af82",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    description: "Must be at least 12 characters long",
                    example: "MyNewSuperSecurePassword123!",
                  },
                  confirmPassword: {
                    type: "string",
                    format: "password",
                    example: "MyNewSuperSecurePassword123!",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Password updated successfully",
          },
          400: {
            description:
              "Token expired, invalid signature, or password mismatch",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
    "/api/auth/activate-owner": {
      post: {
        summary:
          "Activate an approved restaurant owner account and link restaurant infrastructure",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: {
                    type: "string",
                    description:
                      "Security activation token sent by administrator",
                    example: "f4e82...01cb",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    description:
                      "Required only if creating a new user account profile (min 12 chars)",
                    example: "OwnerSecurePass123!",
                  },
                  loginUsername: {
                    type: "string",
                    description: "Optional chosen custom platform username",
                    example: "aarshikitchen",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description:
              "Account successfully configured, restaurant linked and marked active, session token returned",
          },
          400: {
            description: "Invalid or expired activation link",
          },
          409: {
            description: "Username already in use or restaurant already assigned",
          },
          500: {
            description: "Internal server error",
          },
        },
      },
    },
  },
};

export default authDocs;
