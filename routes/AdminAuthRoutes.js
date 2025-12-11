// backend/routes/AdminAuthRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import dotenv from "dotenv";
import { protectAdmin } from "../middleware/authMiddleware.js";
dotenv.config();


const router = express.Router();

// Dev-only seed route (ok to keep)
router.post("/seed", async (req, res) => {
  try {
    const {
      username = "Admin",
      email = "admin@example.com",
      password = "12345678",
    } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists)
      return res.json({
        message: "Admin already exists",
        username: exists.username,
        email: exists.email,
      });

    const admin = new Admin({ username, email, password });
    await admin.save();
    return res.json({
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      message: "Admin seeded",
    });
  } catch (err) {
    console.error("seed err:", err);
    res.status(500).json({ message: "Seed error" });
  }
});

// LOGIN (must return token)
// LOGIN route - copy/paste this into backend/routes/AdminAuthRoutes.js
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email and password required" });

    console.log("LOGIN: attempt for", email);

    const admin = await Admin.findOne({ email }).lean(); // lean() avoids mongoose doc proxies for logging
    if (!admin) {
      console.log("LOGIN: admin not found for", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Debug: does admin have a password field?
    console.log(
      "LOGIN: admin record found. password present:",
      !!admin.password
    );
    // (For safety, do not log the actual password or hash in production.)
    if (!admin.password) {
      console.error(
        "LOGIN: admin exists but password field is missing. Use reset-password or seed to set one."
      );
      return res
        .status(500)
        .json({ message: "Admin exists but password not set on server" });
    }

    // Compare (admin.password is hashed)
    const bcrypt = (await import("bcryptjs")).default;
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("LOGIN: password compare result for", email, "=>", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ensure JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error("LOGIN: JWT_SECRET missing from env");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const jwt = (await import("jsonwebtoken")).default;
    const payload = { id: admin._id, email: admin.email, role: "admin" };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log(
      "LOGIN: token created for",
      email,
      "token startsWith:",
      token?.slice(0, 12)
    );

    return res.json({
      token,
      username: admin.username,
      email: admin.email,
      message: "Login successful",
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// routes/AdminAuthRoutes.js (reset-password)
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: "email and newPassword required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // IMPORTANT: assign plain password and let pre('save') hash it
    admin.password = newPassword;
    await admin.save();

    return res.json({ message: `Password set successfully for admin`, email: admin.email });
  } catch (err) {
    console.error("RESET-PASSWORD ERR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Dev check route (for testing admin authentication)
router.get("/dev", protectAdmin, (req, res) => {
  console.log("DEV route hit by admin:", req.admin ? req.admin.email : "no req.admin");
  res.json({
    message: "Admin authenticated successfully",
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      username: req.admin.username
    }
  });
});


export default router;
