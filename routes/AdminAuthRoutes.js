// backend/routes/AdminAuthRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Dev-only seed route (ok to keep)
router.post("/seed", async (req, res) => {
  try {
    const { username = "Admin", email = "admin@example.com", password = "12345678" } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists) return res.json({ message: "Admin already exists", username: exists.username, email: exists.email });

    const admin = new Admin({ username, email, password });
    await admin.save();
    return res.json({ _id: admin._id, username: admin.username, email: admin.email, message: "Admin seeded" });
  } catch (err) {
    console.error("seed err:", err);
    res.status(500).json({ message: "Seed error" });
  }
});

// LOGIN (must return token)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      username: admin.username,
      email: admin.email,
      message: "Login successful",
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
