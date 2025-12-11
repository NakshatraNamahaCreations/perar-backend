// // routes/adminAuthRoutes.js
// import express from "express";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import Admin from "../models/Admin.js";

// const router = express.Router();

// // helper to create token
// const generateToken = (id) =>
//   jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// /**
//  * POST /api/admin/login
//  * body: { email, password }
//  */
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await Admin.findOne({ email });
//     if (!admin) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const isMatch = await admin.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     const token = generateToken(admin._id);

//     res.json({
//       _id: admin._id,
//       username: admin.username,
//       email: admin.email,
//       token,
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// /**
//  * TEMP route to create first admin
//  * POST /api/admin/seed
//  * body: { username, email, password }
//  * Remove or protect after first use!
//  */
// // router.post("/seed", async (req, res) => {
// //   try {
// //     const { username, email, password } = req.body;

// //     const existing = await Admin.findOne({ email });
// //     if (existing) {
// //       return res.status(400).json({ message: "Admin already exists" });
// //     }

// //     const salt = await bcrypt.genSalt(10);
// //     const passwordHash = await bcrypt.hash(password, salt);

// //     const admin = await Admin.create({ username, email, passwordHash });

// //     res.json({
// //       message: "Admin created",
// //       admin: {
// //         id: admin._id,
// //         username: admin.username,
// //         email: admin.email,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("Seed admin error:", err);
// //     res.status(500).json({ message: "Server error" });
// //   }
// // });

// export default router;


// routes/adminAuthRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import cookieParser from "cookie-parser";

const router = express.Router();

// helper to create token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

/**
 * POST /api/admin/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(admin._id);

    // set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only send cookie over HTTPS in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    };

    res
      .cookie("token", token, cookieOptions)
      .json({
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        message: "Login successful",
      });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/seed", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await Admin.create({ username, email, passwordHash });

    res.json({
      message: "Admin created",
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
      },
    });
  } catch (err) {
    console.error("Seed admin error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;
