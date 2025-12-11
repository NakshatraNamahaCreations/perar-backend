// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db.js";
import adminAuthRoutes from "./routes/AdminAuthRoutes.js";
import adminJobRoutes from "./routes/AdminJobRoutes.js";
import publicJobRoutes from "./routes/PublicJobRoutes.js";

dotenv.config();
const app = express();

// Security headers
app.use(helmet());

// Body + cookie parsing
app.use(express.json());
app.use(cookieParser());

// --- CORS ---
// Allow requests from your frontend origins only (add Netlify / production domain here)
const allowedOrigins = [
  "http://localhost:3000",          // CRA dev
  "http://localhost:5173",          // Vite dev
  "https://your-site.netlify.app",  // Netlify frontend - replace
  "https://www.yourdomain.com"      // your production domain - replace
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (e.g., curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS policy: This origin is not allowed"), false);
    }
    return callback(null, true);
  },
  credentials: true // <-- IMPORTANT: allow cookies to be sent/received
}));

// Basic rate limiting to prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                 // limit each IP
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// connect DB
connectDB();

// routes
app.use("/api/admin", adminAuthRoutes);          // /login, (remove /seed in production)
app.use("/api/admin/jobs", adminJobRoutes);      // admin job CRUD - protect with auth middleware
app.use("/api/jobs", publicJobRoutes);           // public job listing

app.get("/", (req, res) => {
  res.send("Job portal backend running");
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message || err);
  res.status(500).json({ message: err.message || "Server error" });
});

// Listen on 0.0.0.0 so host can route traffic (important for some PaaS)
// Use process.env.PORT set by the host platform
const PORT = process.env.PORT || 8030;
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on port ${PORT}`));
