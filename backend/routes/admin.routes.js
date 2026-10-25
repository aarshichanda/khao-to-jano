import express from "express";
import mongoose from "mongoose";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import Order from "../models/order.model.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Global administrator controls for marketplace order overrides and platform monitoring
 */

router.use(protect, adminOnly);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Fetch all marketplace orders across all restaurants (Admin Only)
 *     description: Retrieves the global order history log sorted by most recent first, populating user profiles and restaurant profiles. Requires an admin token.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Marketplace order stream fetched successfully.
 *       401:
 *         description: Unauthorized - Valid token missing.
 *       403:
 *         description: Forbidden - Requires admin privileges.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   patch:
 *     summary: Override and update an order status to confirmed or cancelled (Admin Only)
 *     description: Updates a restaurant-accepted order to CONFIRMED or CANCELLED, then pushes real-time updates via Socket.io to admins, customers, and restaurant owners. Requires an admin token.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique 24-character hexadecimal MongoDB ObjectId of the target order
 *         example: 65cc2b9c8e1f3a002b5c6789
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderStatus
 *             properties:
 *               orderStatus:
 *                 type: string
 *                 enum: [CONFIRMED, CANCELLED]
 *                 example: CONFIRMED
 *     responses:
 *       200:
 *         description: Order status updated successfully and real-time sockets dispatched.
 *       400:
 *         description: Invalid order ID syntax or illegal target status provided.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden admin context.
 *       404:
 *         description: Target order document not found.
 *       409:
 *         description: Conflict - The restaurant must accept the order before admin can alter it.
 *       500:
 *         description: Internal server processing error.
 */
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
        message: "Admin can set an accepted restaurant order to CONFIRMED or CANCELLED.",
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
        message: "The restaurant must accept the order before KTJ admin can confirm or cancel it.",
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
        io.to(`customer:${order.customer.toString()}`).emit("order-updated", payload);
      }

      if (order.restaurant) {
        io.to(`restaurant:${order.restaurant.toString()}`).emit("order-updated", payload);
      }
    }

    const updatedOrder = await Order.findById(order._id)
      .populate("customer", "username email")
      .populate("restaurant", "name address")
      .lean();

    return res.status(200).json({
      success: true,
      message: orderStatus === "CONFIRMED" ? "Order approved by KTJ admin." : "Order cancelled by KTJ admin.",
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
