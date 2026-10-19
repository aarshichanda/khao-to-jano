import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const router = express.Router();

// POST /api/auth/login - Authenticate customer and return secure JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    // Check if user exists in MongoDB collection
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password credentials" });
    }

    // Verify hashed password match using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password credentials" });
    }

    // Generate secure JWT token tracking user ID and role permissions
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'secretkey123', 
      { expiresIn: '7d' }
    );

   return res.status(200).json({
  success: true,
  token,
  user: {
    id: user._id,
    name: user.username,
    email: user.email,
    role: user.role || "customer"
  }
});
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
