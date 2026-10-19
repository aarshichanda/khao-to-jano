
import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import reviewRoutes from "./routes/review.routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Parse incoming JSON requests
app.use(express.json());

// CORS test route
app.get("/api/cors-test", (req, res) => {
    res.json({
        success: true,
        message: "CORS middleware is working",
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/reviews", reviewRoutes);

// Health-check route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "KTJ backend is running",
    });
});

// Connect to MongoDB before starting the server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, "0.0.0.0", () => {
            console.log("==================================================");
            console.log("KTJ BACKEND DISPATCHED SUCCESSFULLY");
            console.log(`Listening on: http://localhost:${PORT}`);
            console.log(`Network Tunnel: http://127.0.0.1:${PORT}`);
            console.log("==================================================");
        });
    } catch (error) {
        console.error("Failed to start KTJ backend:", error.message);
        process.exit(1);
    }
};

startServer();
