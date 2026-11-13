
import express from "express";
import mongoose from "mongoose";
import { randomUUID, createHash } from "node:crypto";
import { protect } from "../middleware/auth.middleware.js";
import Order from "../models/order.model.js";
import Restaurant from "../models/restaurant.model.js";
import Coupon from "../models/coupon.model.js";
import validate from "../middleware/validate.middleware.js";
import { orderSchema } from "../validators/order.validator.js";

const router = express.Router();

const validId = (id) => {
  if (typeof id !== "string") return false;
  return mongoose.Types.ObjectId.isValid(id.trim());
};

// Validate a coupon against the database and compute its discount.
// Mirrors POST /api/coupons/validate so a single source of truth governs
// which codes exist, their type, caps, expiry, and minimum order amount.
const calculateCouponDiscount = async (couponCode, subtotal) => {
  if (!couponCode) {
    return { valid: true, discount: 0 };
  }

  const coupon = await Coupon.findOne({ code: couponCode });

  if (!coupon) {
    return { valid: false, message: "Invalid coupon code." };
  }

  if (!coupon.isActive) {
    return { valid: false, message: "This coupon is no longer active." };
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return { valid: false, message: "This coupon has expired." };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.`,
    };
  }

  let discount =
    coupon.discountType === "flat"
      ? coupon.discountValue
      : (subtotal * coupon.discountValue) / 100;

  if (
    coupon.discountType === "percentage" &&
    coupon.maxDiscountAmount &&
    discount > coupon.maxDiscountAmount
  ) {
    discount = coupon.maxDiscountAmount;
  }

  // Never discount more than the order itself.
  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    discount: Math.round(discount * 100) / 100,
  };
};

// POST /api/orders — Create one order per restaurant.
router.post("/", protect, validate(orderSchema), async (req, res) => {
  let checkoutId;
  let createdOrders = [];
  let idempotencyKey;
  let requestHash;

  try {
    console.log("[ORDER] Request received", {
      customerId: req.user?._id?.toString(),
      body: JSON.stringify(req.body),
    });

    const {
      restaurant: restaurantId,
      items,
      restaurants,
      deliveryAddress,
      phone,
      paymentMethod,
      couponCode = "",
    } = req.body ?? {};

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authenticated customer not found.",
      });
    }

    // Validate the checkout idempotency key.
    idempotencyKey =
      typeof req.body?.idempotencyKey === "string"
        ? req.body.idempotencyKey.trim()
        : "";

    if (!idempotencyKey || idempotencyKey.length > 100) {
      return res.status(400).json({
        success: false,
        message: "A valid checkout idempotency key is required.",
      });
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method. Use COD or ONLINE.",
      });
    }

    const groups = Array.isArray(restaurants)
      ? restaurants
      : [{ restaurant: restaurantId, items }];

    if (
      groups.length === 0 ||
      groups.some(
        (group) =>
          !validId(group?.restaurant) ||
          !Array.isArray(group.items) ||
          group.items.length === 0,
      )
    ) {
      console.error("[ORDER] Invalid restaurant groups", groups);

      return res.status(400).json({
        success: false,
        message:
          "Provide at least one valid restaurant order. Check the restaurant ID sent by checkout.",
      });
    }

    const restaurantIds = groups.map((group) =>
      String(group.restaurant).trim(),
    );

    if (new Set(restaurantIds).size !== restaurantIds.length) {
      return res.status(400).json({
        success: false,
        message: "Each restaurant must appear only once per checkout.",
      });
    }

    if (
      !deliveryAddress ||
      typeof deliveryAddress.street !== "string" ||
      !deliveryAddress.street.trim() ||
      typeof deliveryAddress.city !== "string" ||
      !deliveryAddress.city.trim() ||
      typeof deliveryAddress.state !== "string" ||
      !deliveryAddress.state.trim() ||
      typeof deliveryAddress.postalCode !== "string" ||
      !deliveryAddress.postalCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a complete delivery address.",
      });
    }

    if (typeof phone !== "string" || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "A phone number is required.",
      });
    }

    const restaurantDocuments = await Restaurant.find({
      _id: { $in: restaurantIds },
      isActive: true,
    });

    const restaurantsById = new Map(
      restaurantDocuments.map((restaurant) => [
        restaurant._id.toString(),
        restaurant,
      ]),
    );

    if (restaurantsById.size !== groups.length) {
      console.error("[ORDER] Restaurant lookup mismatch", {
        requestedIds: restaurantIds,
        foundIds: [...restaurantsById.keys()],
      });

      return res.status(404).json({
        success: false,
        message: "A restaurant was not found or is currently inactive.",
      });
    }

    if (typeof couponCode !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code format.",
      });
    }

    const normalizedCoupon = couponCode.trim().toUpperCase();

    // Build a fingerprint of the checkout request.
    const requestFingerprint = {
      restaurants: groups.map((group) => ({
        restaurant: String(group.restaurant).trim(),
        items: group.items.map((item) => ({
          dishId:
            typeof item?.dishId === "string"
              ? item.dishId.trim()
              : "",
          quantity: Number(item?.quantity),
        })),
      })),
      deliveryAddress: {
        street: deliveryAddress.street.trim(),
        city: deliveryAddress.city.trim(),
        state: deliveryAddress.state.trim(),
        postalCode: deliveryAddress.postalCode.trim(),
      },
      phone: phone.trim(),
      paymentMethod,
      couponCode: normalizedCoupon,
    };

    requestHash = createHash("sha256")
      .update(JSON.stringify(requestFingerprint))
      .digest("hex");

    // Return the existing orders if this checkout attempt was already saved.
    const existingOrders = await Order.find({
      customer: req.user._id,
      idempotencyKey,
    }).sort({ createdAt: 1 });

    if (existingOrders.length > 0) {
      const existingRestaurants = new Set(
        existingOrders.map((order) => order.restaurant.toString()),
      );

      const expectedRestaurants = new Set(restaurantIds);

      const sameRestaurants =
        existingRestaurants.size === expectedRestaurants.size &&
        [...expectedRestaurants].every((id) =>
          existingRestaurants.has(id),
        );

      const sameRequest = existingOrders.every(
        (order) => order.requestHash === requestHash,
      );

      if (!sameRequest) {
        return res.status(409).json({
          success: false,
          message:
            "This checkout key has already been used with different order details. Start a new checkout attempt.",
        });
      }

      if (!sameRestaurants || existingOrders.length !== groups.length) {
        return res.status(409).json({
          success: false,
          message:
            "This checkout is already being processed. Please retry shortly using the same checkout attempt.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Existing checkout retrieved. No duplicate orders created.",
        checkoutId: existingOrders[0].checkoutId,
        orders: existingOrders,
        order: existingOrders[0],
        idempotentReplay: true,
      });
    }

    const normalizedGroups = groups.map((group) => {
      const restaurant = restaurantsById.get(
        String(group.restaurant).trim(),
      );

      const normalizedItems = [];

      for (const item of group.items) {
        const dishId =
          typeof item?.dishId === "string" ? item.dishId.trim() : "";

        if (!validId(dishId)) {
          throw Object.assign(
            new Error("Every cart item must have a valid menu-item ID."),
            { statusCode: 400 },
          );
        }

        const dish = restaurant.menu.id(dishId);

        if (!dish) {
          throw Object.assign(
            new Error(
              `Dish ID ${dishId} does not belong to restaurant ${restaurant.name}.`,
            ),
            { statusCode: 400 },
          );
        }

        if (dish.isAvailable === false) {
          throw Object.assign(
            new Error(`${dish.name} is currently unavailable.`),
            { statusCode: 400 },
          );
        }

        const quantity = Number(item.quantity);

        if (!Number.isSafeInteger(quantity) || quantity < 1) {
          throw Object.assign(
            new Error("Each item must have a valid positive quantity."),
            { statusCode: 400 },
          );
        }

        // Always use the menu's current name and price from MongoDB.
        normalizedItems.push({
          name: dish.name,
          quantity,
          price: dish.price,
        });
      }

      const subtotal =
        Math.round(
          normalizedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ) * 100,
        ) / 100;

      return {
        restaurant,
        items: normalizedItems,
        subtotal,
        deliveryCharge: subtotal > 0 ? 40 : 0,
      };
    });

    const combinedSubtotal = normalizedGroups.reduce(
      (sum, group) => sum + group.subtotal,
      0,
    );

    const couponResult = await calculateCouponDiscount(
      normalizedCoupon,
      combinedSubtotal,
    );

    if (!couponResult.valid) {
      return res.status(400).json({
        success: false,
        message: couponResult.message,
      });
    }

    checkoutId = randomUUID();

    let remainingDiscount = couponResult.discount;

    const orderDocuments = normalizedGroups.map((group) => {
      const discountAmount = Math.min(
        remainingDiscount,
        group.subtotal,
      );

      remainingDiscount =
        Math.round((remainingDiscount - discountAmount) * 100) / 100;

      const totalAmount = Math.max(
        0,
        Math.round(
          (group.subtotal + group.deliveryCharge - discountAmount) * 100,
        ) / 100,
      );

      return {
        checkoutId,
        idempotencyKey,
        requestHash,
        customer: req.user._id,
        restaurant: group.restaurant._id,
        items: group.items,
        deliveryAddress: {
          street: deliveryAddress.street.trim(),
          city: deliveryAddress.city.trim(),
          state: deliveryAddress.state.trim(),
          postalCode: deliveryAddress.postalCode.trim(),
        },
        phone: phone.trim(),
        subtotal: group.subtotal,
        deliveryCharge: group.deliveryCharge,
        totalAmount,
        couponCode: normalizedCoupon,
        discountAmount,
        paymentMethod,
        paymentStatus: "PENDING",
        orderStatus: "PLACED",
      };
    });

    console.log("[ORDER] Saving orders", {
      checkoutId,
      count: orderDocuments.length,
      restaurantIds: orderDocuments.map((order) =>
        order.restaurant.toString(),
      ),
    });

    // Insert all restaurant orders.
    createdOrders = await Order.insertMany(orderDocuments, {
      ordered: true,
    });

    console.log("[ORDER] MongoDB save successful", {
      checkoutId,
      orderIds: createdOrders.map((order) => order._id.toString()),
    });

    // Notify restaurants immediately only for COD orders.
    // ONLINE orders must wait until payment is verified.
    const io = req.app.get("io");

    if (io && paymentMethod === "COD") {
      for (const order of createdOrders) {
        io.to(`restaurant:${order.restaurant.toString()}`).emit("new-order", {
          orderId: order._id.toString(),
        });

        io.to(`customer:${req.user._id.toString()}`).emit("order-updated", {
          orderId: order._id.toString(),
          orderStatus: order.orderStatus,
        });
      }

      io.to("admins").emit("order-updated", {
        checkoutId,
        orderStatus: "PLACED",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "COD"
          ? "Cash on Delivery checkout created successfully."
          : "Pending online checkout created. Complete payment to confirm.",
      checkoutId,
      orders: createdOrders,
      order: createdOrders[0],
    });
  } catch (error) {
    console.error("[ORDER] Creation failed:", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
    });

    // Recover an existing checkout after a MongoDB duplicate-key error.
    if (error.code === 11000 && idempotencyKey) {
      try {
        const duplicateOrders = await Order.find({
          customer: req.user._id,
          idempotencyKey,
        }).sort({ createdAt: 1 });

        const expectedRestaurantIds = Array.isArray(req.body?.restaurants)
          ? req.body.restaurants.map((group) =>
              String(group.restaurant).trim(),
            )
          : [String(req.body?.restaurant).trim()];

        const actualRestaurantIds = duplicateOrders.map((order) =>
          order.restaurant.toString(),
        );

        const expectedRestaurants = new Set(expectedRestaurantIds);
        const actualRestaurants = new Set(actualRestaurantIds);

        const sameRestaurants =
          duplicateOrders.length === expectedRestaurantIds.length &&
          actualRestaurants.size === expectedRestaurants.size &&
          [...expectedRestaurants].every((id) =>
            actualRestaurants.has(id),
          );

        const sameRequest =
          duplicateOrders.length > 0 &&
          duplicateOrders.every(
            (order) => order.requestHash === requestHash,
          );

        const sameCheckout =
          duplicateOrders.length > 0 &&
          duplicateOrders.every(
            (order) =>
              order.checkoutId === duplicateOrders[0].checkoutId,
          );

        if (sameRequest && sameRestaurants && sameCheckout) {
          return res.status(200).json({
            success: true,
            message: "Existing checkout retrieved. No duplicate orders created.",
            checkoutId: duplicateOrders[0].checkoutId,
            orders: duplicateOrders,
            order: duplicateOrders[0],
            idempotentReplay: true,
          });
        }

        return res.status(409).json({
          success: false,
          message:
            "This checkout is already being processed. Please retry using the same checkout attempt.",
        });
      } catch (duplicateError) {
        console.error(
          "[ORDER] Duplicate checkout recovery failed:",
          duplicateError.message,
        );
      }
    }

    if (checkoutId && createdOrders.length === 0) {
      try {
        await Order.deleteMany({ checkoutId });
      } catch (cleanupError) {
        console.error("[ORDER] Cleanup failed:", cleanupError.message);
      }
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode ||
        error.name === "ValidationError" ||
        error.name === "CastError"
          ? error.message
          : "Failed to create order. Check the backend terminal for [ORDER] Creation failed.",
    });
  }
});

// GET /api/orders — Orders belonging to the authenticated customer.
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    })
      .populate("restaurant", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      data: orders,
    });
  } catch (error) {
    console.error("[ORDER] Retrieval failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders.",
    });
  }
});

// GET /api/orders/:id — A customer can only access their own order.
router.get("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    }).populate("restaurant", "name");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("[ORDER] Single-order retrieval failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order.",
    });
  }
});

export default router;
