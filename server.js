// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import adminAuthRoutes from "./routes/AdminAuthRoutes.js";
import adminJobRoutes from "./routes/AdminJobRoutes.js";
import publicJobRoutes from "./routes/PublicJobRoutes.js";
import blogRoutes from "./routes/BlogRoutes.js";
import CandidateRoutes from "./routes/CandidateRoutes.js";

dotenv.config();
const app = express();

/* ================= FIX __dirname (ESM SUPPORT) ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= HELMET ================= */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* ================= BODY PARSING ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= CORS CONFIG (EXPRESS 5 SAFE) ================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://admin.perarinfotech.com",
  "https://perarinfotech.com",
  "https://www.perarinfotech.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman or server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ================= DATABASE ================= */
connectDB();

/* ================= STATIC FILES ================= */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROUTES ================= */

// Admin Auth
app.use("/api/admin", adminAuthRoutes);

// Admin Job CRUD
app.use("/api/admin/jobs", adminJobRoutes);

// Public Jobs
app.use("/api/jobs", publicJobRoutes);

// Blogs
app.use("/api/blogs", blogRoutes);

// Candidates
app.use("/api/candidates", CandidateRoutes);

/* ================= RATE LIMIT ================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("✅ Job portal backend running");
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);

  if (err.message?.includes("CORS")) {
    return res.status(403).json({ message: err.message });
  }

  res.status(500).json({
    message: err.message || "Server error",
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 8030;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});