
import express from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/auth.middleware.js";
import Restaurant from "../models/restaurant.model.js";
import Order from "../models/order.model.js";

const router = express.Router();

router.use(protect);

const getOwnerRestaurant = async (req, res) => {
  const roles = Array.isArray(req.userRoles)
    ? req.userRoles
    : [
        ...(Array.isArray(req.user.roles) ? req.user.roles : []),
        req.user.role,
      ].filter(Boolean);

  if (!roles.includes("restaurant_owner")) {
    res.status(403).json({
      success: false,
      message: "Restaurant-owner access required.",
    });
    return null;
  }

  const restaurant = await Restaurant.findOne({
    owner: req.user._id,
    isActive: true,
  });

  if (!restaurant) {
    res.status(404).json({
      success: false,
      message: "No active restaurant is linked to this owner.",
    });
    return null;
  }

  return restaurant;
};

// GET /api/owner/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const restaurant = await getOwnerRestaurant(req, res);
    if (!restaurant) return;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [activeOrders, todayOrders, totalOrders] =
      await Promise.all([
        Order.countDocuments({
          restaurant: restaurant._id,
          orderStatus: {
            $nin: ["DELIVERED", "CANCELLED"],
          },
        }),

        Order.find({
          restaurant: restaurant._id,
          createdAt: { $gte: startOfToday },
          orderStatus: { $ne: "CANCELLED" },
        }).select("totalAmount orderStatus paymentStatus"),

        Order.countDocuments({
          restaurant: restaurant._id,
        }),
      ]);

    const todayRevenue = todayOrders.reduce(
      (sum, order) => sum + (Number(order.totalAmount) || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          address: restaurant.address,
          cuisine: restaurant.cuisine,
        },
        metrics: {
          activeOrders,
          todayRevenue: Number(todayRevenue.toFixed(2)),
          todayOrderCount: todayOrders.length,
          totalOrders,
        },
      },
    });
  } catch (error) {
    console.error("Owner dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard metrics.",
    });
  }
});

// GET /api/owner/orders
router.get("/orders", async (req, res) => {
  try {
    const restaurant = await getOwnerRestaurant(req, res);
    if (!restaurant) return;

    const orders = await Order.find({
      restaurant: restaurant._id,
    })
      .populate("customer", "username email phone")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Owner orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load restaurant orders.",
    });
  }
});

// PATCH /api/owner/orders/:id/status
router.patch("/orders/:id/status", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const restaurant = await getOwnerRestaurant(req, res);
    if (!restaurant) return;

    const { orderStatus } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: restaurant._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for this restaurant.",
      });
    }

    const allowedTransitions = {
      PLACED: ["RESTAURANT_ACCEPTED", "CANCELLED"],
      RESTAURANT_ACCEPTED: [],
      CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY", "CANCELLED"],
      READY: ["OUT_FOR_DELIVERY"],
      OUT_FOR_DELIVERY: ["DELIVERED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    const permittedNextStates =
      allowedTransitions[order.orderStatus] || [];

    if (!permittedNextStates.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.orderStatus} to ${orderStatus}.`,
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    const io = req.app.get("io");

    if (io) {
      const payload = {
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
      };

      // Notify the KTJ admin dashboard.
      io.to("admins").emit("order-updated", payload);

      // Notify this restaurant's owner dashboard.
      io.to(`restaurant:${restaurant._id}`).emit(
        "order-updated",
        payload
      );

      // Notify the customer who placed the order.
      if (order.customer) {
        io.to(`customer:${order.customer.toString()}`).emit(
          "order-updated",
          payload
        );
      }
    }

    return res.json({
      success: true,
      message:
        orderStatus === "RESTAURANT_ACCEPTED"
          ? "Order accepted by the restaurant. Awaiting KTJ admin approval."
          : orderStatus === "CANCELLED"
            ? "Order rejected by the restaurant."
            : `Order status updated to ${orderStatus}.`,
      data: order,
    });
  } catch (error) {
    console.error("Owner order-status update error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update order status.",
    });
  }
});

export default router;
