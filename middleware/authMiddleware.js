// middleware/authMiddleware.js  (ESM)
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const protectAdmin = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.warn("protectAdmin: no token provided");
      return res.status(401).json({ message: "Not authorized - no token provided" });
    }

    console.log("protectAdmin: token length=", token.length);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("protectAdmin: jwt.verify error ->", err?.message || err);
      return res.status(401).json({ message: "Not authorized - token invalid", error: err?.message });
    }

    if (!decoded?.id) {
      console.warn("protectAdmin: token missing decoded.id", decoded);
      return res.status(401).json({ message: "Not authorized - token payload invalid" });
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      console.warn("protectAdmin: admin not found for id", decoded.id);
      return res.status(401).json({ message: "Not authorized - admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    console.error("protectAdmin: unexpected error", err);
    res.status(500).json({ message: "Server error in auth middleware" });
  }
};

export { protectAdmin };
