// routes/BlogRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/BlogController.js";

const router = express.Router();

// ensure uploads directory
const uploadsDir = path.join(process.cwd(), "uploads");
import fs from "fs";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// multer storage config (store in uploads/)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // unique filename: timestamp-originalname
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({ storage });

// Public read routes
router.get("/", getBlogs);
router.get("/:id", getBlogById);

// Protected routes (create/update/delete) — add your auth middleware if available
// Example: import { protect } from '../middleware/auth.js';
// router.post("/", protect, upload.fields([{ name: 'bannerImage' }, { name: 'extraImage' }]), createBlog);

router.post("/", upload.fields([{ name: "bannerImage" }, { name: "extraImage" }]), createBlog);
router.put("/:id", upload.fields([{ name: "bannerImage" }, { name: "extraImage" }]), updateBlog);
router.delete("/:id", deleteBlog);

export default router;
