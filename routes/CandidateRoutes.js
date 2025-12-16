import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Candidate from "../models/Candidate.js";

const router = express.Router();

/* ---------- ENSURE UPLOAD FOLDER EXISTS ---------- */
const uploadDir = path.join(process.cwd(), "uploads/resumes");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/* ---------- MULTER CONFIG ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

/* ---------- POST CANDIDATE ---------- */
router.post("/", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file || !req.body.jobId) {
      return res.status(400).json({
        message: "Job ID and resume required"
      });
    }

    const candidate = await Candidate.create({
      jobId: req.body.jobId,
      resume: req.file.path
    });

    res.status(201).json({
      message: "Application submitted successfully",
      candidate
    });
  } catch (err) {
    console.error("Candidate upload error:", err);
    res.status(500).json({
      message: "Failed to submit application"
    });
  }
});

export default router;
