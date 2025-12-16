import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog
} from "../controllers/BlogController.js";

const router = express.Router();

/* ---------- ENSURE BLOG UPLOAD DIR EXISTS ---------- */
const blogUploadDir = path.join(process.cwd(), "uploads/blogs");
if (!fs.existsSync(blogUploadDir)) {
  fs.mkdirSync(blogUploadDir, { recursive: true });
}

/* ---------- MULTER CONFIG ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/blogs");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .toLowerCase();

    cb(null, `${Date.now()}-${base}${ext}`);
  }
});



const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  }
});

/* ---------- PUBLIC ROUTES ---------- */
router.get("/", getBlogs);
router.get("/:id", getBlogById);

/* ---------- ADMIN ROUTES ---------- */
// (add auth middleware here if needed)
router.post(
  "/",
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "extraImage", maxCount: 1 }
  ]),
  createBlog
);

router.put(
  "/:id",
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "extraImage", maxCount: 1 }
  ]),
  updateBlog
);

router.delete("/:id", deleteBlog);

export default router;
