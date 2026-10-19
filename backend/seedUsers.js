import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ktj";

async function runSeeder() {
  try {
    console.log("Connecting to MongoDB pipeline...");
    await mongoose.connect(MONGODB_URI);
    console.log("Database connected successfully!");

    // Clear old accounts to avoid duplicate key or email conflicts
    await User.deleteMany({ email: { $in: ['customer@test.com', 'owner@test.com'] } });

    // Hash passwords securely using our newly installed bcrypt package
    const hashedCustomerPassword = await bcrypt.hash('customer123', 10);
    const hashedOwnerPassword = await bcrypt.hash('owner123', 10);

    // 1. Create a Test Customer (with required username field)
    await User.create({
      name: "Aarshi Chanda",
      username: "aarshi_customer", // 💡 FIXED: Added required validation field
      email: "customer@test.com",
      password: hashedCustomerPassword,
      role: "customer",
      phone: "9625706842",
      address: "Behala",
      city: "Kolkata",
      pincode: "700034"
    });

    // 2. Create a Test Restaurant Owner (with required username field)
    await User.create({
      name: "Khao to Jano Owner",
      username: "ktj_owner", // 💡 FIXED: Added required validation field
      email: "owner@test.com",
      password: hashedOwnerPassword,
      role: "restaurant_owner"
    });

    console.log("🎉 SUCCESS: Test Customer and Restaurant Owner seeded into MongoDB!");
  } catch (error) {
    console.error("Seeding failed with error log:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database wrapper.");
    process.exit(0);
  }
}

runSeeder();
