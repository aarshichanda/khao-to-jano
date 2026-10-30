import express from "express";
import mongoose from "mongoose";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import Order from "../models/order.model.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer", "username email")
      .populate("restaurant", "name address")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Admin order retrieval failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve marketplace orders.",
    });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!["CONFIRMED", "CANCELLED"].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Admin can set an accepted restaurant order to CONFIRMED or CANCELLED.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.orderStatus !== "RESTAURANT_ACCEPTED") {
      return res.status(409).json({
        success: false,
        message:
          "The restaurant must accept the order before KTJ admin can confirm or cancel it.",
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

      io.to("admins").emit("order-updated", payload);

      if (order.customer) {
        io.to(`customer:${order.customer.toString()}`).emit(
          "order-updated",
          payload,
        );
      }

      if (order.restaurant) {
        io.to(`restaurant:${order.restaurant.toString()}`).emit(
          "order-updated",
          payload,
        );
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate("customer", "username email")
      .populate("restaurant", "name address")
      .lean();

    return res.status(200).json({
      success: true,
      message:
        orderStatus === "CONFIRMED"
          ? "Order approved by KTJ admin."
          : "Order cancelled by KTJ admin.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Admin order status update failed:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    });
  }
});

export default router;
