
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import Order from "../models/order.model.js";

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateItems = (items) =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.every(
    (item) =>
      item.name?.trim() &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      typeof item.price === "number" &&
      Number.isFinite(item.price) &&
      item.price >= 0
  );

const validateAddress = (address) =>
  address?.street?.trim() &&
  address?.city?.trim() &&
  address?.state?.trim() &&
  address?.postalCode?.trim();

const validateDeliveryCharge = (charge) =>
  typeof charge === "number" &&
  Number.isFinite(charge) &&
  charge >= 0;

export const createOrder = async (req, res) => {
  let checkoutId;

  try {
    const {
      customer,
      restaurant,
      items,
      restaurants,
      deliveryAddress,
      deliveryCharge,
      paymentMethod,
      couponCode,
      discountAmount,
    } = req.body;

    if (!customer || !validId(customer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    if (!validateAddress(deliveryAddress)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a complete delivery address",
      });
    }

    if (!["COD", "ONLINE"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Support the existing single-restaurant checkout.
    const groups = Array.isArray(restaurants)
      ? restaurants
      : [{ restaurant, items, deliveryCharge }];

    if (groups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No restaurant orders were provided",
      });
    }

    const seenRestaurantIds = new Set();

    for (const group of groups) {
      if (
        !group.restaurant ||
        !validId(group.restaurant) ||
        !validateItems(group.items) ||
        !validateDeliveryCharge(group.deliveryCharge)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid restaurant order details",
        });
      }

      const restaurantId = String(group.restaurant);

      if (seenRestaurantIds.has(restaurantId)) {
        return res.status(400).json({
          success: false,
          message: "Each restaurant must appear only once",
        });
      }

      seenRestaurantIds.add(restaurantId);
    }

    checkoutId = randomUUID();

    const normalizedCouponCode =
      typeof couponCode === "string" && couponCode.trim()
        ? couponCode.trim().toUpperCase()
        : "";

    const groupTotals = groups.map((group) => {
      const subtotal = group.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return subtotal + group.deliveryCharge;
    });

    const combinedTotal = groupTotals.reduce((sum, amount) => sum + amount, 0);
    let remainingDiscount =
      normalizedCouponCode &&
      typeof discountAmount === "number" &&
      Number.isFinite(discountAmount) &&
      discountAmount > 0
        ? Math.min(discountAmount, combinedTotal)
        : 0;

    const orderDocuments = groups.map((group) => {
      const subtotal = group.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const baseTotal = subtotal + group.deliveryCharge;
      const appliedDiscount = Math.min(remainingDiscount, baseTotal);
      remainingDiscount -= appliedDiscount;

      return {
        checkoutId,
        customer,
        restaurant: group.restaurant,
        items: group.items.map((item) => ({
          name: item.name.trim(),
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress: {
          street: deliveryAddress.street.trim(),
          city: deliveryAddress.city.trim(),
          state: deliveryAddress.state.trim(),
          postalCode: deliveryAddress.postalCode.trim(),
        },
        subtotal,
        deliveryCharge: group.deliveryCharge,
        totalAmount: baseTotal - appliedDiscount,
        couponCode: normalizedCouponCode,
        discountAmount: appliedDiscount,
        paymentMethod,
      };
    });

    const createdOrders = await Order.insertMany(orderDocuments, {
      ordered: true,
    });

    return res.status(201).json({
      success: true,
      message: "Checkout orders created successfully",
      checkoutId,
      orders: createdOrders,
      order: createdOrders[0],
    });
  } catch (error) {
    // Best-effort cleanup if an ordered insert partially succeeds.
    if (checkoutId) {
      try {
        await Order.deleteMany({ checkoutId });
      } catch (cleanupError) {
        console.error("Order cleanup failed:", cleanupError);
      }
    }

    console.error("Create order failed:", error);

    return res.status(
      error.name === "ValidationError" ||
        error.name === "CastError"
        ? 400
        : 500
    ).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Retrieve orders failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Retrieve order failed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order",
    });
  }
};
