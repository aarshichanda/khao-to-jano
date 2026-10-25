import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT || 5000;

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Khao To Jano API Documentation 🍛",
      version: "1.0.0",
      description: "Interactive API Specification and Testing Dashboard for the Khao To Jano MERN Capstone Marketplace.",
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production" 
          ? "https://onrender.com" 
          : `http://localhost:${PORT}`,
        description: process.env.NODE_ENV === "production" ? "Production Cloud Environment (Render)" : "Local Host Development Engine",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Input your customer or restaurant owner JWT token to request protected platform resources.",
        },
      },
    },
  },
  // Crucial: This absolute path instructs swagger to step out of 'config' and scan your routes folder cleanly
  apis: ["./routes/*.js", "./server.js"], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Ensure the setup instance is exported properly for server.js to catch it
export default swaggerSpec;
