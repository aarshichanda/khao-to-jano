
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

async function inspectOwnerAccounts() {
  try {
    await connectDB();

    // Read directly from MongoDB so fields missing from the Mongoose
    // schema are still visible. No documents are modified.
    const db = mongoose.connection.db;
    const users = await db.collection("users").find({}).toArray();
    const restaurants = await db.collection("restaurants").find({}).toArray();

    const ownerUsers = users.filter(
      (user) =>
        user.role === "restaurant_owner" ||
        (Array.isArray(user.roles) &&
          user.roles.includes("restaurant_owner"))
    );

    const userById = new Map(
      users.map((user) => [user._id.toString(), user])
    );

    const loginCounts = new Map();

    for (const user of ownerUsers) {
      const login = user.loginUsername?.trim().toLowerCase();
      if (login) {
        loginCounts.set(login, (loginCounts.get(login) || 0) + 1);
      }
    }

    console.log("\n========== DATABASE SUMMARY ==========");
    console.log("Database:", db.databaseName);
    console.log("Total users:", users.length);
    console.log("Restaurant-owner accounts:", ownerUsers.length);
    console.log("Total restaurants:", restaurants.length);

    console.log("\n========== OWNER ACCOUNTS ==========");

    for (const user of ownerUsers) {
      const mappedRestaurants = restaurants
        .filter((restaurant) =>
          restaurant.owner &&
          restaurant.owner.toString() === user._id.toString()
        )
        .map((restaurant) => restaurant.name);

      const login = user.loginUsername?.trim().toLowerCase() || "";

      console.log({
        userId: user._id.toString(),
        displayName: user.username || "(missing)",
        loginUsername: login || "(MISSING)",
        email: user.email || "(missing)",
        phone: user.phone || "(empty)",
        role: user.role || "(missing)",
        roles: user.roles || [],
        passwordHashPresent: Boolean(user.password),
        mappedRestaurants:
          mappedRestaurants.length ? mappedRestaurants : ["NONE"],
        loginUsernameDuplicate: login
          ? loginCounts.get(login) > 1
          : false,
      });
    }

    console.log("\n========== RESTAURANT MAPPINGS ==========");

    for (const restaurant of restaurants) {
      const owner = restaurant.owner
        ? userById.get(restaurant.owner.toString())
        : null;

      console.log({
        restaurant: restaurant.name,
        restaurantId: restaurant._id.toString(),
        ownerId: restaurant.owner?.toString() || "(NO OWNER)",
        ownerFound: Boolean(owner),
        ownerLoginUsername: owner?.loginUsername || "(MISSING)",
        ownerRole: owner?.role || "(missing)",
        ownerEmail: owner?.email || "(missing)",
      });
    }

    console.log("\n========== DIAGNOSTIC COMPLETE ==========");
  } catch (error) {
    console.error("Inspection failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

inspectOwnerAccounts();
