
import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import connectDB from "./config/db.js";
import User from "./models/user.model.js";
import Restaurant from "./models/restaurant.model.js";

import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import ownerApplicationRoutes from "./routes/ownerApplication.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import ownerDashboardRoutes from "./routes/ownerDashboard.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import payuRoutes from "./routes/payu.routes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://vercel.app", 
  process.env.FRONTEND_URL,
].filter(Boolean);


const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};


app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const io = new Server(httpServer, {
  cors: corsOptions,
});

// Authenticate Socket.IO connections using the existing JWT.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required."));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secretkey123"
    );

    const user = await User.findById(decoded.id).select("_id role roles");

    if (!user) {
      return next(new Error("User not found."));
    }

    socket.data.userId = user._id.toString();
    socket.data.roles = [
      ...new Set([...(user.roles || []), user.role].filter(Boolean)),
    ];

    if (socket.data.roles.includes("restaurant_owner")) {
      const restaurant = await Restaurant.findOne({
        owner: user._id,
        isActive: true,
      }).select("_id");

      if (!restaurant) {
        return next(
          new Error("No active restaurant linked to this owner.")
        );
      }

      socket.data.restaurantId = restaurant._id.toString();
    }

    next();
  } catch {
    next(new Error("Socket authentication failed."));
  }
});

io.on("connection", (socket) => {
  // Private room for this authenticated user's order updates.
  socket.join(`customer:${socket.data.userId}`);

  // Restaurant-specific room for its authenticated owner.
  if (
    socket.data.roles.includes("restaurant_owner") &&
    socket.data.restaurantId
  ) {
    socket.join(`restaurant:${socket.data.restaurantId}`);
  }

  if (socket.data.roles.includes("admin")) {
    socket.join("admins");
  }

  console.log(
    `Socket connected: user ${socket.data.userId}, roles ${socket.data.roles.join(",")}`
  );

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: user ${socket.data.userId}`);
  });
});

// Expose Socket.IO to Express route handlers.
app.set("io", io);

app.get("/api/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS middleware is working",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/owner-applications", ownerApplicationRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/owner", ownerDashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payu", payuRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "KTJ backend is running",
  });
});

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log("==================================================");
      console.log("KTJ BACKEND STARTED SUCCESSFULLY");
      console.log(`Listening on: http://localhost:${PORT}`);
      console.log(`Network address: http://127.0.0.1:${PORT}`);
      console.log("Socket.IO server initialized");
      console.log("==================================================");
    });
  } catch (error) {
    console.error("Failed to start KTJ backend:", error.message);
    process.exit(1);
  }
};

startServer();
