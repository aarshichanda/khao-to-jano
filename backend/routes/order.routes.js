import express from "express";
import { protect } from '../middleware/auth.middleware.js';
import Order from '../models/order.model.js'; // 💡 FIXED: Added missing database model import
import { getOrderById } from "../controllers/order.controller.js";

const router = express.Router();

// POST /api/orders - Create an order securely linked to the true authenticated customer token
router.post('/', protect, async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, address, phone, city, pincode } = req.body;
    
    // Extracted directly from our decoded JWT gatekeeper middleware
    const customerId = req.user._id; 

    const newOrder = new Order({
      customerId,
      items,
      totalAmount,
      paymentMethod,
      address,
      phone,
      city,
      pincode,
      status: 'Pending'
    });

    await newOrder.save();
    return res.status(201).json({ success: true, orderId: newOrder._id });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders - Fetch clean history matching ONLY the authenticated user (sorted newest first)
router.get('/', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id - Fetch an isolated order single card match
router.get("/:id", protect, getOrderById);

export default router;
