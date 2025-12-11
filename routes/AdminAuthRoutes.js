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
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({ message: "Server config error" });
    }

    const payload = { id: admin._id, email: admin.email, role: "admin" };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Return token so front-end can store it
    return res.json({ token, username: admin.username, email: admin.email, message: "Login successful" });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
