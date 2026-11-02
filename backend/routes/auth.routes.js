import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import User from "../models/user.model.js";
import OwnerApplication from "../models/ownerApplication.model.js";
import Restaurant from "../models/restaurant.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import { JWT_SECRET } from "../config/env.js";

const router = express.Router();

const getUserRoles = (user) => {
  const roles = Array.isArray(user.roles) ? [...user.roles] : [];

  if (user.role && !roles.includes(user.role)) {
    roles.push(user.role);
  }

  return [...new Set(roles)];
};

const normalizeUsername = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;

    const normalizedName = (name || username || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone || "",
      role: "customer",
      roles: ["customer"],
    });

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully.",
      user: {
        id: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
        roles: getUserRoles(user),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists. Please log in.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create your account.",
    });
  }
});

// POST /api/auth/login
// Supports email login and restaurant-owner username login.
router.post("/login", async (req, res) => {
  try {
    const identifier =
      typeof req.body.identifier === "string"
        ? req.body.identifier.trim()
        : typeof req.body.username === "string"
          ? req.body.username.trim()
          : typeof req.body.email === "string"
            ? req.body.email.trim()
            : "";

    const { password } = req.body;

    if (!identifier || typeof password !== "string" || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your username or email and password.",
      });
    }

    const isEmail = identifier.includes("@");
    let user;

    if (isEmail) {
      user = await User.findOne({
        email: identifier.toLowerCase(),
      });
    } else {
      user = await User.findOne({
        loginUsername: normalizeUsername(identifier),
        $or: [{ role: "restaurant_owner" }, { roles: "restaurant_owner" }],
      });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password.",
      });
    }

    const roles = getUserRoles(user);

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        roles,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.username,
        username: user.loginUsername || user.username,
        email: user.email,
        role: user.role,
        roles,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
});

/* PASSWORD RESET ROUTES */

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const genericMessage =
    "If an account exists for this email, password reset instructions will be sent.";

  let user = null;

  try {
    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered email address.",
      });
    }

    user = await User.findOne({ email }).select(
      "+passwordResetTokenHash +passwordResetExpiresAt",
    );

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const resetUrl = new URL("/reset-password", frontendUrl);
    resetUrl.searchParams.set("token", rawToken);

    const safeName = String(user.username || "there").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );

    const safeResetUrl = resetUrl.href.replace(/&/g, "&amp;");

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Khao To Jano password",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;line-height:1.6;color:#333">
            <h2 style="color:#48241d">Khao To Jano</h2>
            <p>Hello ${safeName},</p>
            <p>We received a request to reset your account password.</p>
            <p>
              <a href="${safeResetUrl}"
                 style="display:inline-block;padding:12px 20px;background:#b83f20;color:#fff;text-decoration:none;border-radius:6px">
                Reset Password
              </a>
            </p>
            <p>This link expires in 30 minutes and can be used only once.</p>
            <p>If you did not request a password reset, you can ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();

      throw emailError;
    }

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message:
        "Unable to send reset instructions right now. Please try again later.",
    });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (
      typeof token !== "string" ||
      !token.trim() ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid reset token and new password are required.",
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 12 characters long.",
      });
    }

    if (confirmPassword !== undefined && confirmPassword !== password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpiresAt");

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "This password reset link is invalid or expired. Please request a new one.",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Your password has been reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password right now. Please try again.",
    });
  }
});

// POST /api/auth/activate-owner
// Activates an approved restaurant-owner application.
router.post("/activate-owner", async (req, res) => {
  let user = null;
  let createdUser = false;
  let claimedRestaurantId = null;
  let application = null;
  let originalUserRole = null;
  let originalUserRoles = null;
  let originalLoginUsername = null;

  try {
    const { token, password } = req.body;

    if (typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid activation token is required.",
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    application = await OwnerApplication.findOne({
      status: "approved",
      activationTokenHash: tokenHash,
      activationExpiresAt: { $gt: new Date() },
      activatedAt: null,
    }).select("+activationTokenHash");

    if (!application) {
      return res.status(400).json({
        success: false,
        message: "The activation link is invalid, expired, or already used.",
      });
    }

    if (!application.restaurant) {
      return res.status(409).json({
        success: false,
        message:
          "No restaurant is linked to this application. Please contact the administrator.",
      });
    }

    const isExistingRestaurant = application.restaurantIsExisting === true;

    const existingUser = await User.findOne({
      email: application.email.trim().toLowerCase(),
    });

    if (!existingUser) {
      if (typeof password !== "string" || password.length < 12) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 12 characters.",
        });
      }

      // Prefer an explicitly supplied login username.
      // Otherwise create a predictable ID from the applicant's name.
      const requestedUsername = normalizeUsername(
        req.body.loginUsername || application.loginUsername,
      );

      const generatedUsername = normalizeUsername(
        application.applicantName,
      ).replace(/[^a-z0-9]/g, "");

      const loginUsername = requestedUsername || generatedUsername;

      if (!loginUsername) {
        return res.status(400).json({
          success: false,
          message: "A valid restaurant-owner login username is required.",
        });
      }

      const usernameTaken = await User.findOne({ loginUsername });

      if (usernameTaken) {
        return res.status(409).json({
          success: false,
          message:
            "That login username is already in use. Please choose another.",
        });
      }

      user = await User.create({
        username: application.applicantName,
        loginUsername,
        email: application.email.trim().toLowerCase(),
        phone: application.phone || "",
        password: await bcrypt.hash(password, 12),
        role: "restaurant_owner",
        roles: ["restaurant_owner"],
      });

      createdUser = true;
    } else {
      user = existingUser;

      originalUserRole = user.role;
      originalUserRoles = Array.isArray(user.roles)
        ? [...user.roles]
        : undefined;
      originalLoginUsername = user.loginUsername;

      const roles = getUserRoles(user);

      if (!roles.includes("restaurant_owner")) {
        roles.push("restaurant_owner");
      }

      if (user.role !== "admin" && user.role !== "restaurant_owner") {
        user.role = "restaurant_owner";
      }

      // Never replace an existing login username or password.
      // Set a username only if this account does not already have one.
      if (!user.loginUsername) {
        const requestedUsername = normalizeUsername(
          req.body.loginUsername || application.loginUsername,
        );

        const generatedUsername = normalizeUsername(
          application.applicantName,
        ).replace(/[^a-z0-9]/g, "");

        const loginUsername = requestedUsername || generatedUsername;

        if (!loginUsername) {
          return res.status(400).json({
            success: false,
            message: "A valid restaurant-owner login username is required.",
          });
        }

        const usernameTaken = await User.findOne({
          loginUsername,
          _id: { $ne: user._id },
        });

        if (usernameTaken) {
          return res.status(409).json({
            success: false,
            message:
              "That login username is already in use. Please choose another.",
          });
        }

        user.loginUsername = loginUsername;
      }

      user.roles = [...new Set(roles)];
      await user.save();
    }

    // Assign only an unowned restaurant.
    // Existing listings must remain active.
    const restaurantFilter = {
      _id: application.restaurant,
      owner: null,
      isActive: isExistingRestaurant,
    };

    const restaurantUpdate = {
      $set: isExistingRestaurant
        ? { owner: user._id }
        : { owner: user._id, isActive: true },
    };

    const restaurant = await Restaurant.findOneAndUpdate(
      restaurantFilter,
      restaurantUpdate,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!restaurant) {
      if (createdUser) {
        await User.deleteOne({ _id: user._id });
        user = null;
        createdUser = false;
      } else if (user) {
        user.role = originalUserRole;

        if (originalUserRoles === undefined) {
          user.set("roles", undefined);
        } else {
          user.roles = originalUserRoles;
        }

        user.loginUsername = originalLoginUsername;
        await user.save();
      }

      return res.status(409).json({
        success: false,
        message:
          "The restaurant is no longer available for assignment. Please contact the administrator.",
      });
    }

    claimedRestaurantId = restaurant._id;

    application.activatedAt = new Date();
    application.activationTokenHash = null;
    application.activationExpiresAt = null;

    await application.save();

    const roles = getUserRoles(user);

    const sessionToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        roles,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      success: true,
      message: "Restaurant-owner account activated successfully.",
      token: sessionToken,
      user: {
        id: user._id,
        name: user.username,
        username: user.loginUsername || user.username,
        email: user.email,
        role: user.role,
        roles,
      },
    });
  } catch (error) {
    console.error("Owner activation error:", error);

    if (user && claimedRestaurantId) {
      try {
        const isExistingRestaurant = application?.restaurantIsExisting === true;

        await Restaurant.updateOne(
          {
            _id: claimedRestaurantId,
            owner: user._id,
          },
          {
            $set: isExistingRestaurant
              ? { owner: null }
              : { owner: null, isActive: false },
          },
        );
      } catch (rollbackError) {
        console.error("Restaurant rollback error:", rollbackError);
      }
    }

    if (user && createdUser) {
      try {
        await User.deleteOne({ _id: user._id });
      } catch (rollbackError) {
        console.error("User rollback error:", rollbackError);
      }
    } else if (user && originalUserRole !== null) {
      try {
        user.role = originalUserRole;

        if (originalUserRoles === undefined) {
          user.set("roles", undefined);
        } else {
          user.roles = originalUserRoles;
        }

        user.loginUsername = originalLoginUsername;
        await user.save();
      } catch (rollbackError) {
        console.error("Existing user rollback error:", rollbackError);
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account already exists with that email or username.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to activate the owner account.",
    });
  }
});

export default router;
