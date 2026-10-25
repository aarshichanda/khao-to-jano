
import mongoose from "mongoose";

const ownerApplicationSchema = new mongoose.Schema(
  {
    applicantName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    restaurantName: {
      type: String,
      required: true,
      trim: true,
    },

    restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    default: null,
   },

   restaurantIsExisting: {
   type: Boolean,
   default: false,
  },

    restaurantAddress: {
      type: String,
      required: true,
      trim: true,
    },

    cuisine: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedAt: { type: Date, default: null },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    activationTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    activationExpiresAt: {
      type: Date,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

ownerApplicationSchema.index({ email: 1, status: 1 });

const OwnerApplication = mongoose.model(
  "OwnerApplication",
  ownerApplicationSchema
);

export default OwnerApplication;
