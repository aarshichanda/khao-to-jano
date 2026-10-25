
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Restaurant from "../models/restaurant.model.js";

const RESTAURANT_ID = "6ad8753f6be2b9a9a0b0ec14";

// Temporary menu data for testing the customer checkout flow.
const menuItems = [
  {
    name: "Chicken Momos",
    description: "Freshly prepared chicken momos served with dipping sauce.",
    price: 149,
    isAvailable: true,
  },
  {
    name: "Veg Momos",
    description: "Freshly prepared vegetable momos served with dipping sauce.",
    price: 119,
    isAvailable: true,
  },
  {
    name: "Chicken Thukpa",
    description: "Noodle soup with chicken and vegetables.",
    price: 199,
    isAvailable: true,
  },
  {
    name: "Veg Chow Mein",
    description: "Stir-fried noodles with fresh vegetables.",
    price: 159,
    isAvailable: true,
  },
  {
    name: "Chicken Fried Rice",
    description: "Fried rice with chicken and vegetables.",
    price: 189,
    isAvailable: true,
  },
];

const updatePechuMechhu = async () => {
  try {
    await connectDB();

    const restaurant = await Restaurant.findById(RESTAURANT_ID);

    if (!restaurant) {
      throw new Error(`PechuMechhu not found: ${RESTAURANT_ID}`);
    }

    if (restaurant.name !== "PechuMechhu") {
      throw new Error(
        `Safety check failed. Found "${restaurant.name}", not "PechuMechhu".`
      );
    }

    // Update only this restaurant's image and menu.
    // Keep its owner, address, cuisine, status and other fields unchanged.
    restaurant.image =
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80";

    restaurant.menu = menuItems;

    await restaurant.save();

    console.log("PechuMechhu updated successfully.");
    console.log("Menu items:", restaurant.menu.length);
    console.log("Image:", restaurant.image);
    console.log(
      "Menu:",
      restaurant.menu.map(({ name, price }) => `${name} — ₹${price}`)
    );
  } catch (error) {
    console.error("PechuMechhu update failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

updatePechuMechhu();
