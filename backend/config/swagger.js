import swaggerJsdoc from "swagger-jsdoc";

import authDocs from "./docs/auth.docs.js";
import orderDocs from "./docs/order.docs.js";
import restaurantDocs from "./docs/restaurant.docs.js";
import couponDocs from "./docs/coupon.docs.js";
import reviewDocs from "./docs/review.docs.js";
import ownerApplicationDocs from "./docs/ownerApplication.docs.js";
import ownerDocs from "./docs/owner.docs.js";
import ownerDashboardDocs from "./docs/ownerDashboard.docs.js";
import adminDocs from "./docs/admin.docs.js";
import payuDocs from "./docs/payu.docs.js";

const PORT = process.env.PORT || 5000;

// Every per-resource OpenAPI fragment. Each contributes its own tags,
// paths, and (optionally) component schemas to the final spec.
const docFragments = [
  authDocs,
  orderDocs,
  restaurantDocs,
  couponDocs,
  reviewDocs,
  ownerApplicationDocs,
  ownerDocs,
  ownerDashboardDocs,
  adminDocs,
  payuDocs,
];

// Merge the per-resource fragments into the base definition:
// concatenate tag arrays, and merge paths + component schemas objects.
const mergeDocFragments = (base, fragments) => {
  const tags = [...(base.tags ?? [])];
  const paths = { ...(base.paths ?? {}) };
  const schemas = { ...(base.components?.schemas ?? {}) };

  for (const fragment of fragments) {
    if (Array.isArray(fragment.tags)) {
      tags.push(...fragment.tags);
    }

    if (fragment.paths) {
      for (const [path, methods] of Object.entries(fragment.paths)) {
        // Merge methods for the same path so two files can document
        // different verbs on one route without clobbering each other.
        paths[path] = { ...(paths[path] ?? {}), ...methods };
      }
    }

    if (fragment.components?.schemas) {
      Object.assign(schemas, fragment.components.schemas);
    }
  }

  return {
    ...base,
    tags,
    paths,
    components: {
      ...base.components,
      schemas: {
        ...(base.components?.schemas ?? {}),
        ...schemas,
      },
    },
  };
};

const baseDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Khao To Jano API Documentation 🍛",
    version: "1.0.0",
    description:
      "Interactive API Specification and Testing Dashboard for the Khao To Jano MERN Capstone Marketplace.",
  },
  servers: [
    {
      url:
        process.env.NODE_ENV === "production"
          ? "https://onrender.com"
          : `http://localhost:${PORT}`,
      description:
        process.env.NODE_ENV === "production"
          ? "Production Cloud Environment (Render)"
          : "Local Host Development Engine",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Input your customer or restaurant owner JWT token to request protected platform resources.",
      },
    },
  },
};

const swaggerOptions = {
  definition: mergeDocFragments(baseDefinition, docFragments),
  // Docs now live in ./docs/*.docs.js fragments merged above, so there is
  // nothing left for swagger-jsdoc to scan from the route-file comments.
  apis: [],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Ensure the setup instance is exported properly for server.js to catch it
export default swaggerSpec;
