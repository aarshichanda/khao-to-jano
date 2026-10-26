import express from "express";
import Restaurant from "../models/restaurant.model.js";
import OwnerApplication from "../models/ownerApplication.model.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Owner Management
 *   description: Onboarding verification metrics and initial restaurant profile mapping keys
 */

/**
 * @swagger
 * /api/owner/link-restaurant:
 *   post:
 *     summary: Verify and confirm the structural restaurant link for an activated owner
 *     description: Cross-checks approved registration logs to prevent duplicate kitchen profile allocation anomalies. Requires an active owner bearer token.
 *     tags: [Owner Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant link confirmed and active data structure fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Restaurant is already linked to this owner.
 *                 data:
 *                   type: object
 *                   properties:
 *                     restaurantId:
 *                       type: string
 *                       example: 65cb1a8b9f1d2c001f4a5678
 *                     name:
 *                       type: string
 *                       example: Khao To Jano Corporate Kitchen
 *                     address:
 *                       type: string
 *                       example: "Sector V, Salt Lake, Kolkata"
 *       403:
 *         description: Forbidden - Requires restaurant_owner role permissions.
 *       404:
 *         description: Not Found - No activated restaurant profile mapped to this email identity.
 *       409:
 *         description: Conflict - Target restaurant asset is already owned or configuration is mismatching.
 *       500:
 *         description: Internal server validation failure.
 */
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
