
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import connectDB from "./config/db.js";
import User from "./models/user.model.js";
import Restaurant from "./models/restaurant.model.js";

const TEMP_PASSWORD = "KTJ@123";

const restaurantAccounts = [
  { restaurantName: "The Royal Biryani House", username: "royalbiryani" },
  { restaurantName: "Kolkata Spice Kitchen", username: "kolkataspice" },
  { restaurantName: "The Healthy Green Bowl", username: "healthygreenbowl" },
  { restaurantName: "Munchies Fast Food Corner", username: "munchies" },
  { restaurantName: "Sweet Bengal Desserts", username: "sweetbengal" },
  { restaurantName: "Flavors of North India", username: "flavorsofnorthindia" },
  { restaurantName: "Chinatown Express", username: "chinatownexpress" },
  { restaurantName: "The South Indian Tiffin Room", username: "southindiantiffin" },
  { restaurantName: "Continental Bistro", username: "continentalbistro" },
  { restaurantName: "Tandoori Junction", username: "tandoorijunction" },
  { restaurantName: "Bhojohori Ranna", username: "bhojohoriranna" },
  { restaurantName: "The Daily Salad Co.", username: "dailysalad" },
  { restaurantName: "Wok & Roll", username: "wokandroll" },
  { restaurantName: "Idli Street", username: "idlistreet" },
  { restaurantName: "The Kebab Factory", username: "kebabfactory" },
  { restaurantName: "Cafe Coffee Lounge", username: "cafecoffeelounge" },
  { restaurantName: "Aminia Express", username: "aminiaexpress" },
  { restaurantName: "Arsalan Delights", username: "arsalandelights" },
  { restaurantName: "Peter Cat Replica", username: "petercatreplica" },
  { restaurantName: "Mocambo Vibes", username: "mocambovibes" },
  { restaurantName: "Kusum Rolls", username: "kusumrolls" },
  { restaurantName: "The Burger Club", username: "theburgerclub" },
  { restaurantName: "Pizza Fusion", username: "pizzafusion" },
  { restaurantName: "Dawat-e-Khas", username: "dawateekhas" },
  { restaurantName: "6 Ballygunge Place Mini", username: "ballygunge6mini" },
  { restaurantName: "Oudh Aromas", username: "oudharomas" },
  { restaurantName: "Wow Momo Hub", username: "wowmomohub" },
  { restaurantName: "The Dessert Parlour", username: "dessertparlour" },
  { restaurantName: "Healthy Keto Kitchen", username: "healthyketokitchen" },
  { restaurantName: "Street Food Express", username: "streetfoodexpress" },
];

const getRoles = (user) => {
  const roles = Array.isArray(user.roles) ? [...user.roles] : [];

  if (user.role && !roles.includes(user.role)) {
    roles.push(user.role);
  }

  if (!roles.includes("restaurant_owner")) {
    roles.push("restaurant_owner");
  }

  return [...new Set(roles)];
};

async function createOwnerAccounts() {
  try {
    if (restaurantAccounts.length !== 30) {
      throw new Error("Expected exactly 30 restaurant accounts.");
    }

    await connectDB();

    // Ensure the loginUsername unique index is initialized.
    await User.init();

    const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 12);

    let created = 0;
    let updated = 0;

    for (const account of restaurantAccounts) {
      const { restaurantName, username } = account;

      const restaurant = await Restaurant.findOne({
        name: restaurantName,
      });

      if (!restaurant) {
        throw new Error(
          `Restaurant not found: ${restaurantName}. No account was created for it.`
        );
      }

      // Reuse the owner already mapped to this restaurant, if present.
      let owner = restaurant.owner
        ? await User.findById(restaurant.owner)
        : null;

      if (restaurant.owner && !owner) {
        throw new Error(
          `${restaurantName} references a missing owner account.`
        );
      }

      // Refuse to take over a username belonging to another account.
      const usernameUser = await User.findOne({
        loginUsername: username,
      });

      if (
        usernameUser &&
        owner &&
        !usernameUser._id.equals(owner._id)
      ) {
        throw new Error(
          `Username "${username}" belongs to a different user.`
        );
      }

      if (!owner && usernameUser) {
        // Reuse an existing account only if it is not mapped elsewhere.
        const otherRestaurant = await Restaurant.findOne({
          owner: usernameUser._id,
          _id: { $ne: restaurant._id },
        });

        if (otherRestaurant) {
          throw new Error(
            `Username "${username}" is already mapped to ${otherRestaurant.name}.`
          );
        }

        owner = usernameUser;
      }

      if (!owner) {
        // This reserved .invalid address is not a real mailbox.
        // It satisfies the required unique email field for local testing.
        owner = new User({
          username: restaurantName,
          loginUsername: username,
          email: `${username}@owners.khaotojano.invalid`,
          phone: "",
          password: hashedPassword,
          role: "restaurant_owner",
          roles: ["restaurant_owner"],
        });

        await owner.save();
        created++;
      } else {
        // Preserve the existing email and display name.
        // Reset the password only for this explicitly requested test setup.
        owner.loginUsername = username;
        owner.password = hashedPassword;

        const roles = getRoles(owner);

        if (owner.role !== "admin") {
          owner.role = "restaurant_owner";
        }

        owner.roles = roles;

        await owner.save();
        updated++;
      }

      // Never overwrite a different existing restaurant mapping.
      if (!restaurant.owner) {
        restaurant.owner = owner._id;
        await restaurant.save();
      } else if (!restaurant.owner.equals(owner._id)) {
        throw new Error(
          `Owner mapping mismatch for ${restaurantName}; stopping safely.`
        );
      }

      console.log(`Ready: ${restaurantName} -> ${username}`);
    }

    console.log("\nOwner account setup finished.");
    console.log(`New accounts created: ${created}`);
    console.log(`Existing accounts updated: ${updated}`);
    console.log(`Temporary password: ${TEMP_PASSWORD}`);
    console.log("Restaurant orders were not modified.");
  } catch (error) {
    console.error("\nOwner account setup stopped:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

createOwnerAccounts();
