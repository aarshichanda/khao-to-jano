
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "./config/db.js";

const accounts = [
  { restaurant: "The Royal Biryani House", username: "royalbiryani" },
  { restaurant: "Kolkata Spice Kitchen", username: "kolkataspice" },
  { restaurant: "The Healthy Green Bowl", username: "healthygreenbowl" },
  { restaurant: "Munchies Fast Food Corner", username: "munchies" },
  { restaurant: "Sweet Bengal Desserts", username: "sweetbengal" },
  { restaurant: "Flavors of North India", username: "flavorsofnorthindia" },
  { restaurant: "Chinatown Express", username: "chinatownexpress" },
  { restaurant: "The South Indian Tiffin Room", username: "southindiantiffin" },
  { restaurant: "Continental Bistro", username: "continentalbistro" },
  { restaurant: "Tandoori Junction", username: "tandoorijunction" },
  { restaurant: "Bhojohori Ranna", username: "bhojohoriranna" },
  { restaurant: "The Daily Salad Co.", username: "dailysalad" },
  { restaurant: "Wok & Roll", username: "wokandroll" },
  { restaurant: "Idli Street", username: "idlistreet" },
  { restaurant: "The Kebab Factory", username: "kebabfactory" },
  { restaurant: "Cafe Coffee Lounge", username: "cafecoffeelounge" },
  { restaurant: "Aminia Express", username: "aminiaexpress" },
  { restaurant: "Arsalan Delights", username: "arsalandelights" },
  { restaurant: "Peter Cat Replica", username: "petercatreplica" },
  { restaurant: "Mocambo Vibes", username: "mocambovibes" },
  { restaurant: "Kusum Rolls", username: "kusumrolls" },
  { restaurant: "The Burger Club", username: "theburgerclub" },
  { restaurant: "Pizza Fusion", username: "pizzafusion" },
  { restaurant: "Dawat-e-Khas", username: "dawateekhas" },
  { restaurant: "6 Ballygunge Place Mini", username: "ballygunge6mini" },
  { restaurant: "Oudh Aromas", username: "oudharomas" },
  { restaurant: "Wow Momo Hub", username: "wowmomohub" },
  { restaurant: "The Dessert Parlour", username: "dessertparlour" },
  { restaurant: "Healthy Keto Kitchen", username: "healthyketokitchen" },
  { restaurant: "Street Food Express", username: "streetfoodexpress" },
];

async function repairOwnerUsernames() {
  try {
    if (accounts.length !== 30) {
      throw new Error("Expected exactly 30 restaurant account mappings.");
    }

    await connectDB();

    const db = mongoose.connection.db;
    const users = db.collection("users");
    const restaurants = db.collection("restaurants");

    // Prepare and validate every change before writing anything.
    const repairs = [];
    const claimedUsernames = new Map();

    for (const account of accounts) {
      const restaurant = await restaurants.findOne(
        { name: account.restaurant },
        { projection: { _id: 1, owner: 1, name: 1 } }
      );

      if (!restaurant) {
        throw new Error(`Restaurant not found: ${account.restaurant}`);
      }

      if (!restaurant.owner) {
        throw new Error(`Restaurant has no owner: ${account.restaurant}`);
      }

      const owner = await users.findOne(
        { _id: restaurant.owner },
        {
          projection: {
            _id: 1,
            username: 1,
            loginUsername: 1,
            role: 1,
            roles: 1,
          },
        }
      );

      if (!owner) {
        throw new Error(`Owner document not found: ${account.restaurant}`);
      }

      const isOwner =
        owner.role === "restaurant_owner" ||
        (Array.isArray(owner.roles) &&
          owner.roles.includes("restaurant_owner"));

      if (!isOwner) {
        throw new Error(
          `Mapped account is not a restaurant owner: ${account.restaurant}`
        );
      }

      const desired = account.username.toLowerCase();
      const existing = owner.loginUsername?.trim().toLowerCase();

      if (existing && existing !== desired) {
        throw new Error(
          `${account.restaurant} already has a different loginUsername: ${existing}`
        );
      }

      const previousClaim = claimedUsernames.get(desired);
      if (previousClaim && previousClaim !== owner._id.toString()) {
        throw new Error(`Duplicate target username: ${desired}`);
      }
      claimedUsernames.set(desired, owner._id.toString());

      const collision = await users.findOne({
        loginUsername: desired,
        _id: { $ne: owner._id },
      });

      if (collision) {
        throw new Error(
          `Username "${desired}" already belongs to another account.`
        );
      }

      if (!existing) {
        repairs.push({
          restaurant: account.restaurant,
          username: desired,
          ownerId: owner._id,
        });
      }
    }

    // The validation phase has succeeded. Only missing fields are updated.
    let updated = 0;

    for (const repair of repairs) {
      const result = await users.updateOne(
        {
          _id: repair.ownerId,
          $or: [
            { loginUsername: { $exists: false } },
            { loginUsername: null },
            { loginUsername: "" },
          ],
        },
        { $set: { loginUsername: repair.username } }
      );

      if (result.modifiedCount !== 1) {
        throw new Error(
          `Could not safely update ${repair.restaurant}; inspect the record before continuing.`
        );
      }

      updated++;
      console.log(`Updated: ${repair.restaurant} -> ${repair.username}`);
    }

    console.log("\nRepair finished.");
    console.log(`Accounts already correct: ${30 - repairs.length}`);
    console.log(`Missing usernames repaired: ${updated}`);
    console.log("Passwords, roles and restaurant mappings were not modified.");
    console.log("Orders were not modified.");
  } catch (error) {
    console.error("\nRepair stopped:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

repairOwnerUsernames();
