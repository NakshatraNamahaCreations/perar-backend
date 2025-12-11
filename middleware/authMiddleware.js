// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const protectAdmin = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Try HttpOnly cookie first (recommended for security)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2️⃣ Fallback to Authorization header: Bearer <token>
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token from either source → not authorized
    if (!token) {
      return res.status(401).json({
        message: "Not authorized – no token provided",
      });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ Fetch admin from DB
    const admin = await Admin.findById(decoded.id).select("-passwordHash");
    if (!admin) {
      return res.status(401).json({
        message: "Not authorized – admin not found",
      });
    }

    // Attach admin to request
    req.admin = admin;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      message:
        error.name === "TokenExpiredError"
          ? "Not authorized – token expired"
          : "Not authorized – token invalid",
    });
  }
};
