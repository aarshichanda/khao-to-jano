
import "dotenv/config";
import mongoose from "mongoose";

const RESTAURANT_ID = "6ad25691f2613256455948d9";
const ORDER_ID = "6adb747014f2abc142418423";

try {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  const restaurant = await db.collection("restaurants").findOne({
    _id: new mongoose.Types.ObjectId(RESTAURANT_ID),
  });

  if (!restaurant) {
    throw new Error("Target restaurant was not found.");
  }

  if (restaurant.owner) {
    console.log("Restaurant already has an owner:", restaurant.owner);
  } else {
    const candidates = await db.collection("users").find({
      $or: [
        { role: "restaurant_owner" },
        { roles: "restaurant_owner" },
      ],
    }, {
      projection: { username: 1, email: 1, role: 1, roles: 1 },
    }).toArray();

    if (candidates.length !== 1) {
      console.log(
        `SAFE STOP: Found ${candidates.length} restaurant-owner accounts.`
      );
      console.log(
        "No database changes made. Candidate account IDs:",
        candidates.map((user) => ({
          id: user._id,
          username: user.username,
          email: user.email,
        }))
      );
    } else {
      const owner = candidates[0];

      const result = await db.collection("restaurants").updateOne(
        {
          _id: restaurant._id,
          owner: { $exists: false },
        },
        {
          $set: { owner: owner._id },
        }
      );

      if (result.modifiedCount !== 1) {
        throw new Error(
          "Restaurant mapping was not updated. Check the current database record."
        );
      }

      console.log("Restaurant-owner mapping repaired.");
      console.log("Restaurant:", restaurant.name);
      console.log("Owner account ID:", owner._id);
    }
  }

  const updatedRestaurant = await db.collection("restaurants").findOne({
    _id: restaurant._id,
  });

  const order = await db.collection("orders").findOne({
    _id: new mongoose.Types.ObjectId(ORDER_ID),
  });

  console.log("\nVerification:");
  console.log(JSON.stringify({
    restaurant: updatedRestaurant && {
      id: updatedRestaurant._id,
      name: updatedRestaurant.name,
      owner: updatedRestaurant.owner,
      isActive: updatedRestaurant.isActive,
    },
    existingOrder: order && {
      id: order._id,
      restaurant: order.restaurant,
      status: order.orderStatus,
    },
  }, null, 2));
} catch (error) {
  console.error("Repair failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
