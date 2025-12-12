// routes/BlogRoutes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from '../controllers/BlogController.js';

const router = express.Router();

// ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// multer config - store files in ./uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 }, // 4 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

// Public
router.get('/', getBlogs);
router.get('/:id', getBlogById);

// Admin (protected in your real app via auth middleware)
router.post('/', upload.fields([{ name: 'bannerImage' }, { name: 'extraImage' }]), createBlog);
router.put('/:id', upload.fields([{ name: 'bannerImage' }, { name: 'extraImage' }]), updateBlog);
router.delete('/:id', deleteBlog);

export default router;
