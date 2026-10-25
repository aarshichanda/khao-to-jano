
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/user.model.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ktj";

async function seedTestUser({
  username,
  email,
  password,
  role,
  phone = "",
}) {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    // Preserve the existing account ID and password.
    existingUser.role = role;

    const existingRoles = Array.isArray(existingUser.roles)
      ? existingUser.roles
      : [];

    existingUser.roles = [
      ...new Set([...existingRoles, role]),
    ];

    await existingUser.save();

    console.log(`Existing test account preserved: ${normalizedEmail}`);
    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email: normalizedEmail,
    password: hashedPassword,
    phone,
    role,
    roles: [role],
  });

  console.log(`Created test account: ${normalizedEmail}`);
  return user;
}

async function seedUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    await seedTestUser({
      username: "aarshi_customer",
      email: "customer@test.com",
      password: "customer123",
      role: "customer",
      phone: "9999999999",
    });

    await seedTestUser({
      username: "ktj_owner",
      email: "owner@test.com",
      password: "owner123",
      role: "restaurant_owner",
      phone: "9999999998",
    });

    console.log("Test-user seeding completed.");
  } catch (error) {
    console.error("Test-user seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedUsers();
