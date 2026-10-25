
import express from "express";
import Restaurant from "../models/restaurant.model.js";
import OwnerApplication from "../models/ownerApplication.model.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Verify that the authenticated owner is linked to the restaurant
// created during admin approval and owner activation.
// Never create a duplicate restaurant through this endpoint.
router.post("/link-restaurant", protect, async (req, res) => {
  try {
    if (req.user.role !== "restaurant_owner") {
      return res.status(403).json({
        success: false,
        message: "Restaurant-owner access required.",
      });
    }

    const application = await OwnerApplication.findOne({
      email: req.user.email.toLowerCase(),
      status: "approved",
      activatedAt: { $ne: null },
    });

    if (!application || !application.restaurant) {
      return res.status(404).json({
        success: false,
        message:
          "No activated restaurant is linked to this owner application. Please contact the administrator.",
      });
    }

    // Confirm that the application restaurant belongs to this owner.
    const restaurant = await Restaurant.findOne({
      _id: application.restaurant,
      owner: req.user._id,
      isActive: true,
    });

    if (!restaurant) {
      return res.status(409).json({
        success: false,
        message:
          "The approved restaurant is not linked to this owner. No changes were made.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Restaurant is already linked to this owner.",
      data: {
        restaurantId: restaurant._id,
        name: restaurant.name,
        address: restaurant.address,
      },
    });
  } catch (error) {
    console.error("Owner restaurant-link error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify the restaurant link.",
    });
  }
});

export default router;
