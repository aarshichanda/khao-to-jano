
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/user.model.js";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const createAdmin = async () => {
  const rl = createInterface({ input, output });

  try {
    const username = (await rl.question("Admin username: ")).trim();
    const email = (
      await rl.question("Admin email: ")
    ).trim().toLowerCase();
    const password = await rl.question("Admin password (12+ characters): ");

    if (!username || !email || !password) {
      throw new Error("Username, email and password are required.");
    }

    if (password.length < 12) {
      throw new Error("Password must be at least 12 characters long.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error(
        "This email already exists. No account was changed."
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      username,
      email,
      password: hashedPassword,
      role: "admin",
    });

    console.log("\nAdmin account created successfully.");
    console.log(`Username: ${admin.username}`);
    console.log(`Role: ${admin.role}`);
    console.log("Password stored as a bcrypt hash.");
  } catch (error) {
    console.error("\nAdmin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
};

createAdmin();
