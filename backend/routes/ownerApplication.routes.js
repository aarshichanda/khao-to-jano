import express from "express";
import crypto from "node:crypto";
import mongoose from "mongoose";

import OwnerApplication from "../models/ownerApplication.model.js";
import Restaurant from "../models/restaurant.model.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Owner Applications
 *   description: Onboarding management for new restaurant owners and administrative review dashboards
 */

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

/**
 * @swagger
 * /api/owner-applications:
 *   post:
 *     summary: Publicly submit a new restaurant-owner onboarding application
 *     description: Accepts onboarding parameters for verification. Enforces maximum character limits and prevents redundant submissions for pending emails.
 *     tags: [Owner Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - applicantName
 *               - email
 *               - phone
 *               - restaurantName
 *               - restaurantAddress
 *             properties:
 *               applicantName:
 *                 type: string
 *                 example: Aarshi Chanda
 *               email:
 *                 type: string
 *                 format: email
 *                 example: owner@khaokitchen.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               restaurantName:
 *                 type: string
 *                 example: Khao To Jano Corporate Kitchen
 *               restaurantAddress:
 *                 type: string
 *                 example: "Sector V, Salt Lake, Kolkata"
 *               cuisine:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["North Indian", "Bengali", "Mughlai"]
 *     responses:
 *       201:
 *         description: Application submitted successfully for admin review.
 *       400:
 *         description: Missing mandatory parameter parameters or fields exceed allowed length.
 *       409:
 *         description: Duplicate application detected with an identical active pending profile state.
 *       500:
 *         description: Internal server error.
 */
router.post("/", async (req, res) => {
  try {
    const {
      applicantName,
      email,
      phone,
      restaurantName,
      restaurantAddress,
      cuisine,
    } = req.body;

    const requiredFields = [
      applicantName,
      email,
      phone,
      restaurantName,
      restaurantAddress,
    ];

    if (
      requiredFields.some(
        (value) => typeof value !== "string" || !value.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide your name, email, phone number, restaurant name, and address.",
      });
    }

    if (
      cuisine !== undefined &&
      (!Array.isArray(cuisine) ||
        cuisine.some((item) => typeof item !== "string"))
    ) {
      return res.status(400).json({
        success: false,
        message: "Cuisine must be provided as a list of strings.",
      });
    }

    if (
      applicantName.trim().length > 100 ||
      email.trim().length > 254 ||
      phone.trim().length > 20 ||
      restaurantName.trim().length > 150 ||
      restaurantAddress.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more fields exceed the permitted length.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const pendingApplication = await OwnerApplication.findOne({
      email: normalizedEmail,
      status: "pending",
    });

    if (pendingApplication) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending application.",
      });
    }

    const application = await OwnerApplication.create({
      applicantName: applicantName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      restaurantName: restaurantName.trim(),
      restaurantAddress: restaurantAddress.trim(),
      cuisine: (cuisine || []).map((item) => item.trim()).filter(Boolean),
      restaurant: null,
      restaurantIsExisting: false,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted for review.",
      application: {
        id: application._id,
        restaurantName: application.restaurantName,
        status: application.status,
      },
    });
  } catch (error) {
    console.error("Owner application error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit the application.",
    });
  }
});

/**
 * @swagger
 * /api/owner-applications:
 *   get:
 *     summary: List all onboarding applications (Admin Only)
 *     description: Returns a complete history log sorted by most recent date. Automatically removes tokens from search results to preserve data security. Requires an admin token.
 *     tags: [Owner Applications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Applications list fetched successfully.
 *       401:
 *         description: Unauthorized - Valid token missing.
 *       403:
 *         description: Forbidden - Requires administrator rights.
 *       500:
 *         description: Internal server error.
 */
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const applications = await OwnerApplication.find()
      .sort({ createdAt: -1 })
      .select("-activationTokenHash");

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error("Admin application-list error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve applications.",
    });
  }
});

/**
 * @swagger
 * /api/owner-applications/available-existing-restaurants:
 *   get:
 *     summary: Fetch active unowned restaurants not already reserved (Admin Only)
 *     description: Lists available unowned restaurants to assign to incoming candidate applicants. Requires an admin token.
 *     tags: [Owner Applications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Available unowned restaurant entities filtered successfully.
 *       401:
 *         description: Unauthorized access.
 *       403:
 *         description: Forbidden admin context.
 *       500:
 *         description: Internal server breakdown.
 */
router.get(
  "/available-existing-restaurants",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const reservedRestaurantIds = await OwnerApplication.distinct(
        "restaurant",
        {
          restaurantIsExisting: true,
          status: { $in: ["pending", "approved"] },
          restaurant: { $ne: null },
        }
      );

      const restaurants = await Restaurant.find({
        owner: null,
        isActive: true,
        _id: { $nin: reservedRestaurantIds },
      })
        .select("_id name address cuisine")
        .sort({ name: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: restaurants.length,
        restaurants,
      });
    } catch (error) {
      console.error("Available existing restaurants error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to retrieve available existing restaurants.",
      });
    }
  }
);

/**
 * @swagger
 * /api/owner-applications/{id}/assign-existing:
 *   patch:
 *     summary: Link an active unowned restaurant to a pending application (Admin Only)
 *     description: Maps an unowned restaurant record directly onto a target application. Requires an admin token.
 *     tags: [Owner Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the pending owner application record
 *         example: 65cc2b9c8e1f3a002b5c1111
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *             properties:
 *               restaurantId:
 *                 type: string
 *                 description: MongoDB ObjectId of the target unowned restaurant record
 *                 example: 65cb1a8b9f1d2c001f4a5678
 *     responses:
 *       200:
 *         description: Restaurant link assigned smoothly.
 *       400:
 *         description: Invalid syntax parameters format.
 *       404:
 *         description: Application file context missing.
 *       409:
 *         description: Conflict - Target restaurant is already assigned to a different application.
 *       500:
 *         description: Internal server error.
 */
router.patch(
  "/:id/assign-existing",
  protect,
  adminOnly,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { restaurantId } = req.body;

      if (
        !mongoose.isValidObjectId(id) ||
        !mongoose.isValidObjectId(restaurantId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid application ID or restaurant ID.",
        });
      }

      const application = await OwnerApplication.findOne({
        _id: id,
        status: "pending",
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Pending application not found.",
        });
      }

      const restaurant = await Restaurant.findOne({
        _id: restaurantId,
        owner: null,
        isActive: true,
      });

      if (!restaurant) {
        return res.status(409).json({
          success: false,
          message:
            "The restaurant is unavailable, inactive, or already assigned.",
        });
      }

      const conflictingApplication = await OwnerApplication.findOne({
        _id: { $ne: application._id },
        restaurant: restaurant._id,
        restaurantIsExisting: true,
        status: { $in: ["pending", "approved"] },
      });

      if (conflictingApplication) {
        return res.status(409).json({
          success: false,
          message:
            "This restaurant is already reserved for another owner application.",
        });
      }

      application.restaurant = restaurant._id;
      application.restaurantIsExisting = true;
      await application.save();

      return res.status(200).json({
        success: true,
        message: "Existing restaurant linked to the pending application.",
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
        },
      });
    } catch (error) {
      console.error("Existing restaurant assignment error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to assign the existing restaurant.",
      });
    }
  }
);

/**
 * @swagger
 * /api/owner-applications/{id}/approve:
 *   patch:
 *     summary: Approve onboarding applications and generate verification email signals (Admin Only)
 *     description: Validates mapping criteria, updates application status flags, creates new blank restaurant assets if needed, and issues secure 24-hour verification emails to applicants. Requires an admin token.
 *     tags: [Owner Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the pending owner application record
 *         example: 65cc2b9c8e1f3a002b5c1111
 *     responses:
 *       200:
 *         description: Application approved. Activation links sent out via mailing nodes.
 *       400:
 *         description: Invalid ObjectId structure parameters.
 *       404:
 *         description: Target documentation entity missing.
 *       409:
 *         description: Application status is not pending or targeted assets are no longer available.
 *       500:
 *         description: Internal engine or connection fault while shipping secure emails.
 */
router.patch("/:id/approve", protect, adminOnly, async (req, res) => {
  let application;
  let createdRestaurantId = null;
  let previousState = null;

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    application = await OwnerApplication.findById(id).select(
      "+activationTokenHash"
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    if (application.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: "Only pending applications can be approved.",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      return res.status(500).json({
        success: false,
        message: "FRONTEND_URL is not configured.",
      });
    }

    let restaurant = null;

    if (application.restaurantIsExisting) {
      if (!application.restaurant) {
        return res.status(409).json({
          success: false,
          message:
            "This application is marked for an existing restaurant but has no restaurant linked.",
        });
      }

      restaurant = await Restaurant.findOne({
        _id: application.restaurant,
        owner: null,
        isActive: true,
      });

      if (!restaurant) {
        return res.status(409).json({
          success: false,
          message:
            "The selected existing restaurant is no longer available for assignment.",
        });
      }

      const conflictingApplication = await OwnerApplication.findOne({
        _id: { $ne: application._id },
        restaurant: restaurant._id,
        restaurantIsExisting: true,
        status: { $in: ["pending", "approved"] },
      });

      if (conflictingApplication) {
        return res.status(409).json({
          success: false,
          message:
            "This restaurant is reserved for another owner application.",
        });
      }
    } else if (application.restaurant) {
      return res.status(409).json({
        success: false,
        message:
          "This application already references a restaurant. Verify the mapping before approving it.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    previousState = {
      status: application.status,
      reviewedAt: application.reviewedAt,
      reviewedBy: application.reviewedBy,
      activationTokenHash: application.activationTokenHash,
      activationExpiresAt: application.activationExpiresAt,
      activatedAt: application.activatedAt,
      restaurant: application.restaurant,
      restaurantIsExisting: application.restaurantIsExisting,
    };

    if (!application.restaurantIsExisting) {
      restaurant = await Restaurant.create({
        name: application.restaurantName,
        address: application.restaurantAddress,
        cuisine: application.cuisine,
        owner: null,
        isActive: false,
        menu: [],
      });

      createdRestaurantId = restaurant._id;
      application.restaurant = restaurant._id;
    }

    application.status = "approved";
    application.reviewedAt = new Date();
    application.reviewedBy = req.user._id;
    application.activationTokenHash = tokenHash;
    application.activationExpiresAt = expiresAt;
    application.activatedAt = null;

    await application.save();

    const baseUrl = frontendUrl.replace(/\/+$/, "");
    const activationUrl = `${baseUrl}/activate-owner?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendEmail({
        to: application.email,
        subject: "Your Khao To Jano restaurant application is approved",
        html: `
          <h2>Welcome to Khao To Jano</h2>
          <p>Hello ${escapeHtml(application.applicantName)},</p>
          <p>Your application for <strong>${escapeHtml(application.restaurantName)}</strong> has been approved.</p>
          <p>Use the link below to activate your restaurant-owner access. This link expires in 24 hours.</p>
          <p><a href="${activationUrl}">Activate your owner account</a></p>
        `,
      });
    } catch (emailError) {
      application.status = previousState.status;
      application.reviewedAt = previousState.reviewedAt;
      application.reviewedBy = previousState.reviewedBy;
      application.activationTokenHash = previousState.activationTokenHash;
      application.activationExpiresAt = previousState.activationExpiresAt;
      application.activatedAt = previousState.activatedAt;
      application.restaurant = previousState.restaurant;
      application.restaurantIsExisting = previousState.restaurantIsExisting;

      await application.save();

      if (createdRestaurantId) {
        await Restaurant.deleteOne({
          _id: createdRestaurantId,
          owner: null,
          isActive: false,
        });
        createdRestaurantId = null;
      }
      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: "Application approved. Activation email accepted.",
      application: {
        id: application._id,
        restaurantId: restaurant._id,
        restaurantName: restaurant.name,
        status: application.status,
        activationExpiresAt: application.activationExpiresAt,
        restaurantIsExisting: application.restaurantIsExisting,
      },
    });
  } catch (error) {
    console.error("Owner application approval error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to complete approval. Check the server logs.",
    });
  }
});

/**
 * @swagger
 * /api/owner-applications/{id}/reject:
 *   patch:
 *     summary: Reject a pending onboarding application (Admin Only)
 *     description: Flags an active pending submission record as rejected. Requires an admin token.
 *     tags: [Owner Applications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the pending owner application record
 *         example: 65cc2b9c8e1f3a002b5c1111
 *     responses:
 *       200:
 *         description: Onboarding application flagged rejected successfully.
 *       400:
 *         description: Malformed identification syntax parameters.
 *       404:
 *         description: Record reference target missing.
 *       409:
 *         description: Conflict - Target application status is not pending.
 *       500:
 *         description: Internal server fault.
 */
router.patch("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application ID.",
      });
    }

    const application = await OwnerApplication.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        $set: {
          status: "rejected",
          reviewedAt: new Date(),
          reviewedBy: req.user._id,
          activationTokenHash: null,
          activationExpiresAt: null,
        },
      },
      { new: true, runValidators: true }
    );

    if (!application) {
      const exists = await OwnerApplication.exists({ _id: id });
      return res.status(exists ? 409 : 404).json({
        success: false,
        message: exists ? "Only pending applications can be rejected." : "Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application rejected.",
      application: {
        id: application._id,
        status: application.status,
        reviewedAt: application.reviewedAt,
      },
    });
  } catch (error) {
    console.error("Owner application rejection error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reject the application.",
    });
  }
});

export default router;
