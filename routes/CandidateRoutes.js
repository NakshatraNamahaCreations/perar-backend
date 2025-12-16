import express from "express";
import multer from "multer";
import Candidate from "../models/Candidate.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/resumes",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post("/", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file || !req.body.jobId) {
      return res.status(400).json({ message: "Job ID and resume required" });
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
    res.status(500).json({ message: "Failed to submit application" });
  }
});

export default router;
