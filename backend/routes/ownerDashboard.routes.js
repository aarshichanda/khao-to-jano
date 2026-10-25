import express from "express";
import mongoose from "mongoose";
import { protect } from "../middleware/auth.middleware.js";
import Restaurant from "../models/restaurant.model.js";
import Order from "../models/order.model.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Owner Dashboard & Operations
 *   description: Restaurant metrics dashboard tracking, historical order management, and workflow status operations
 */

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

/**
 * @swagger
 * /api/owner/dashboard:
 *   get:
 *     summary: Retrieve real-time sales revenue metrics and counts (Owner Only)
 *     description: Computes total active checkout orders, accumulates today's revenue calculations, and checks total historical volume constraints. Requires a restaurant owner bearer token.
 *     tags: [Owner Dashboard & Operations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary metrics loaded successfully.
 *       403:
 *         description: Forbidden - Requires a restaurant_owner profile signature.
 *       404:
 *         description: Not Found - Active restaurant mapping target missing.
 *       500:
 *         description: Internal runtime breakdown.
 */
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

/**
 * @swagger
 * /api/owner/orders:
 *   get:
 *     summary: Fetch latest historical orders received by this restaurant (Owner Only)
 *     description: Streams incoming order documents matching this business profile, sorted by date descending up to a maximum limit of 100 entries. Requires a restaurant owner bearer token.
 *     tags: [Owner Dashboard & Operations]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: History logs fetched cleanly.
 *       403:
 *         description: Forbidden - Owner credentials missing.
 *       404:
 *         description: Active restaurant entity missing.
 *       500:
 *         description: Internal server error.
 */
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

/**
 * @swagger
 * /api/owner/orders/{id}/status:
 *   patch:
 *     summary: Update an order status through permitted tracking sequences (Owner Only)
 *     description: Transitions order states sequentially (e.g., PLACED to RESTAURANT_ACCEPTED or CANCELLED, READY to OUT_FOR_DELIVERY) and fires Socket.io notifications to all active dashboard channels. Requires a restaurant owner bearer token.
 *     tags: [Owner Dashboard & Operations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique 24-character hexadecimal MongoDB ObjectId of the target order record
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
 *                 enum: [RESTAURANT_ACCEPTED, CANCELLED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED]
 *                 example: RESTAURANT_ACCEPTED
 *     responses:
 *       200:
 *         description: Step transition applied successfully and event signals routed.
 *       400:
 *         description: Malformed syntax parameter or illegal transition rule violation.
 *       403:
 *         description: Forbidden profile contextual permission.
 *       404:
 *         description: Target order document not found under this business profile space.
 *       500:
 *         description: Internal validation pipeline runtime failure.
 */
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

      io.to("admins").emit("order-updated", payload);
      io.to(`restaurant:${restaurant._id}`).emit("order-updated", payload);

      if (order.customer) {
        io.to(`customer:${order.customer.toString()}`).emit("order-updated", payload);
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
