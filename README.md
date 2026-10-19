# Khao To Jano 🍽️

**A MERN-based food delivery marketplace capstone project**

Khao To Jano is a full-stack food delivery marketplace being developed to connect customers with restaurants and their menus through a single platform. The project focuses on restaurant discovery, food browsing, customer authentication, cart and checkout flows, and order management.

**Project status:** In development

## Features

### Implemented and tested during development

- Customer registration and login flow.
- Restaurant discovery and restaurant detail pages.
- Search for restaurants and dishes.
- Menu browsing with food images and descriptions.
- Cart and checkout interface.
- Order placement and retrieval APIs.
- MongoDB persistence using Mongoose.
- Restaurant, user, order, coupon, and review data models.
- Authentication routes and JWT-related middleware.
- Order API validation and error handling for documented scenarios.

### Technology stack

**Frontend**
- React
- Vite
- JavaScript
- CSS
- Redux Toolkit and React Redux

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

**Development and testing**
- Git and GitHub
- Postman
- npm

## Project structure

```text
Khao To Jano/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── docs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── Testing/
│   ├── utils/
│   ├── validators/
│   ├── seed.js
│   ├── seedUsers.js
│   ├── server.js
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── images/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── redux/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── README.md
└── .gitignore
```

## Getting started

### Prerequisites

- Node.js and npm
- MongoDB locally or through MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone https://github.com/aarshichanda/khao-to-jano.git
cd khao-to-jano
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a local `.env` file with the environment variables required by the backend configuration. Configure your MongoDB connection string and any other required settings.

Never commit `.env` files, credentials, or API keys.

Start the backend from the `backend` directory:

```bash
node server.js
```

The backend has been run locally on port `5000` during development.

### 3. Set up the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`. Use the URL displayed in your terminal if it differs.

Ensure the frontend API configuration points to the running backend.

## API testing

Postman has been used to test the order API.

The recorded scenarios cover:

- Creating an order with valid details.
- Rejecting an order with missing payment information.
- Retrieving saved orders.
- Retrieving an order by ID.
- Rejecting an invalid order ID.
- Handling a nonexistent order.

Test results are documented in `backend/Testing/order-api-test-results.md`.

These results cover the documented scenarios; they do not imply that every endpoint or security case has been tested.

## Development roadmap

Planned enhancements and areas for further validation include:

- Expanded automated testing and request validation.
- Swagger/OpenAPI documentation.
- Real-time order updates.
- Image upload integration.
- Payment gateway integration.
- Further role-based dashboards and permissions.
- Redis integration where appropriate.
- Docker-based development and deployment.
- Production-readiness checks and deployment.

These items are planned or require further implementation and verification.

## Project goals

Khao To Jano is an evolving full-stack capstone project focused on connecting frontend experiences to backend APIs, working with persistent data, and building a maintainable application structure.

## Repository

[GitHub: Khao To Jano](https://github.com/aarshichanda/khao-to-jano)

---

*Built as an evolving full-stack project. Features and documentation will be updated as development progresses.*
