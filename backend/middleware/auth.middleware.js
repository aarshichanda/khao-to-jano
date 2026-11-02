import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_SECRET } from "../config/env.js";

const getUserRoles = (user) => {
  if (!user) return [];

  const roles = Array.isArray(user.roles) ? [...user.roles] : [];

  // Include the legacy primary role for backward compatibility.
  if (user.role && !roles.includes(user.role)) {
    roles.push(user.role);
  }

  return [...new Set(roles)];
};

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. No token provided.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session not found.",
      });
    }

    // Always use current database roles, not stale role claims in the JWT.
    req.user = user;
    req.userRoles = getUserRoles(user);

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token validation failed.",
    });
  }
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const roles = req.userRoles || getUserRoles(req.user);

    const allowed = allowedRoles.some((role) => roles.includes(role));

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have the required role.",
      });
    }

    next();
  };
};

export const adminOnly = (req, res, next) => {
  const roles = req.userRoles || getUserRoles(req.user);

  if (!roles.includes("admin")) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }

  next();
};

export const restaurantOwnerOnly = requireRole("restaurant_owner");

export const customerOnly = requireRole("customer");
