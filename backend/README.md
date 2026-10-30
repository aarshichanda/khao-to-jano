# Khao To Jano API - Backend Service

This is the Node.js, Express, and MongoDB backend application for the **Khao To Jano** Food Delivery App Capstone Project. The project is in development. The API handles user authentication, cart management, restaurant data, and real-time order processing workflows.

## Deployments

Deployment URLs will be listed here once the service is hosted. During development the API runs locally on port `5000`, with interactive API documentation available at `/api-docs`.

---

## Containerization & Local Infrastructure

This application is fully containerized using Docker to ensure environment parity across production cloud nodes and local development workstations.

### Prerequisites

- Docker Desktop or Docker Engine installed on your host system (optional for evaluation).
- A valid local configuration profile (`.env` file).

### Building the Container Image

To compile the lightweight Linux configuration layer and bundle production source configurations, execute the following command from the root backend directory:

```bash
docker build -t khao-to-jano-backend .
```

### Running the Application Service

To instantiate the isolated runtime engine on local interface port `5000` while securely feeding structural environment configurations:

```bash
docker run -p 5000:5000 --env-file .env khao-to-jano-backend
```

---

## Tech Stack & Architecture

- **Runtime:** Node.js (v18-alpine environment)
- **Framework:** Express.js
- **Database Engine:** MongoDB Atlas (Cloud Cluster Infrastructure)
- **Container Technology:** Docker (Dockerfile architectural blueprints)
- **API Specification Suite:** Swagger UI & OpenAPI 3.0.0
