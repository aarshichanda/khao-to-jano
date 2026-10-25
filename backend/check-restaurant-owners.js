
import "dotenv/config";
import mongoose from "mongoose";
import Restaurant from "./models/restaurant.model.js";
import User from "./models/user.model.js";

try {
  await mongoose.connect(process.env.MONGO_URI);

  const restaurants = await Restaurant.find({})
    .select("name owner isActive")
    .populate("owner", "username email role")
    .lean();

  console.log(
    JSON.stringify(
      restaurants.map((restaurant) => ({
        restaurantId: String(restaurant._id),
        name: restaurant.name,
        owner: restaurant.owner
          ? {
              id: String(restaurant.owner._id),
              username: restaurant.owner.username,
              email: restaurant.owner.email,
              role: restaurant.owner.role,
            }
          : null,
        isActive: restaurant.isActive,
      })),
      null,
      2
    )
  );
} catch (error) {
  console.error("Inspection failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
