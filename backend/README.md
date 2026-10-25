# Khao To Jano API - Backend Service

This is the production-ready Node.js, Express, and MongoDB backend application for the **Khao To Jano** Food Delivery App Capstone Project. The API handles user authentication, cart management, restaurant streams, and real-time order processing workflows.

## Live Deployments

- **Backend API Server:** [https://onrender.com](https://onrender.com)
- **Interactive API Documentation:** [https://onrender.com/api-docs](https://onrender.com/api-docs)

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

- **Runtime:** Node.js (High-performance v18-alpine environment)
- **Framework:** Express.js
- **Database Engine:** MongoDB Atlas (Cloud Cluster Infrastructure)
- **Container Technology:** Docker (Dockerfile architectural blueprints)
- **API Specification Suite:** Swagger UI & OpenAPI 3.0.0
