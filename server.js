// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./config/db.js";
import adminAuthRoutes from "./routes/AdminAuthRoutes.js";
import adminJobRoutes from "./routes/AdminJobRoutes.js";
import publicJobRoutes from "./routes/PublicJobRoutes.js";
import blogRoutes from "./routes/BlogRoutes.js";
import CandidateRoutes from "./routes/CandidateRoutes.js";

dotenv.config();
const app = express();

/* ---------------- HELMET ---------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

/* ---------------- BODY PARSING ---------------- */
app.use(express.json());
app.use(cookieParser());

/* ---------------- CORS (FINAL FIX) ---------------- */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, Postman, curl
      if (!origin) return callback(null, true);

      // ✅ Allow ALL localhost ports
      if (origin.startsWith("http://localhost")) {
        return callback(null, true);
      }

      // ✅ Allow ALL Netlify deployments
      if (origin.endsWith(".netlify.app")) {
        return callback(null, true);
      }

      if (
  origin === "https://perarinfotech.com" ||
  origin.endsWith(".perarinfotech.com")
) {
  return callback(null, true);
}

      // ✅ Optional: allow your custom domains
      const allowedDomains = [
        "https://perarinfotect.com","https://admin.perarinfotech.com/login", "https://admin.perarinfotech.com"
      ];

      if (allowedDomains.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS policy: Origin not allowed"), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

/* ---------------- DATABASE ---------------- */
connectDB();

/* ---------------- STATIC FILES ---------------- */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ---------------- ROUTES ---------------- */

// Admin auth
app.use("/api/admin", adminAuthRoutes);

// Admin job CRUD (protected)
app.use("/api/admin/jobs", adminJobRoutes);

// ✅ Public job APIs
app.use("/api/jobs", publicJobRoutes);

// Blogs
app.use("/api/blogs", blogRoutes);

// Candidate 
app.use("/api/candidates", CandidateRoutes);

/* ---------------- RATE LIMIT (AFTER ROUTES) ---------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
  res.send("✅ Job portal backend running");
});

/* ---------------- ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);

  if (err.message?.includes("CORS")) {
    return res.status(403).json({ message: err.message });
  }

  res.status(500).json({ message: err.message || "Server error" });
});

/* ---------------- SERVER ---------------- */
const PORT = process.env.PORT || 8030;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
