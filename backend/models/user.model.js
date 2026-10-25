
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

   loginUsername: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      default: undefined,
      },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    // Password reset fields
    passwordResetTokenHash: {
      type: String,
      default: undefined,
      select: false,
    },

    passwordResetExpiresAt: {
      type: Date,
      default: undefined,
      select: false,
    },

    // Legacy primary role: retained for backward compatibility.
    role: {
      type: String,
      enum: ["customer", "restaurant_owner", "admin"],
      default: "customer",
    },

    // A single account can hold multiple roles.
    // Existing records without this field remain valid.
    roles: {
      type: [
        {
          type: String,
          enum: ["customer", "restaurant_owner", "admin"],
        },
      ],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Keep the legacy role represented in the multi-role list.
// Mongoose 9 uses promise-based middleware; do not call next().
userSchema.pre("save", function () {
  const currentRoles = Array.isArray(this.roles)
    ? [...this.roles]
    : [];

  if (this.role && !currentRoles.includes(this.role)) {
    currentRoles.push(this.role);
  }

  // Preserve customer access for new customer accounts.
  if (
    this.isNew &&
    this.role === "customer" &&
    !currentRoles.includes("customer")
  ) {
    currentRoles.push("customer");
  }

  this.roles = [...new Set(currentRoles)];
});

// Check whether the account has a particular role.
userSchema.methods.hasRole = function (role) {
  return (
    this.role === role ||
    (Array.isArray(this.roles) && this.roles.includes(role))
  );
};

const User = mongoose.model("User", userSchema);

export default User;
