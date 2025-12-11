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
// backend/routes/AdminAuthRoutes.js (login part)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "email and password required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    // If password missing in DB, return helpful message instead of letting bcrypt throw
    if (!admin.password) {
      console.error("LOGIN: admin found but password missing for", email);
      return res.status(500).json({
        message: "Admin exists but password is not set on the server. Please set a password using the reset endpoint."
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const payload = { id: admin._id, email: admin.email, role: "admin" };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.json({ token, username: admin.username, email: admin.email, message: "Login successful" });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


// Temporary reset-password route - REMOVE IN PRODUCTION
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ message: "email and newPassword required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // hash password and save
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    admin.password = hashed;
    await admin.save();

    return res.json({ message: "Password set successfully for admin", email: admin.email });
  } catch (err) {
    console.error("RESET-PASSWORD ERR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DEV ONLY: /api/admin/dev-token?email=admin@example.com
// Adds an easy way to issue a JWT for a seeded admin when shell/DB access isn't available.
// IMPORTANT: Remove this route immediately after use.

router.get("/dev-token", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ message: "email query param required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing");
      return res.status(500).json({ message: "Server config error (JWT_SECRET missing)" });
    }

    const payload = { id: admin._id, email: admin.email, role: "admin" };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    // don't set cookie here — return token so frontend/Postman can use it
    return res.json({ token, email: admin.email, username: admin.username, message: "DEV token issued — remove endpoint in production" });
  } catch (err) {
    console.error("DEV-TOKEN ERR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});



export default router;
