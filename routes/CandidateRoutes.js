import express from "express";
import multer from "multer";
import Candidate from "../models/Candidate.js";

const router = express.Router();

/* ---------- MULTER SETUP ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

/* ---------- POST: APPLY JOB ---------- */
router.post("/", upload.single("cv"), async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId || !req.file) {
      return res.status(400).json({
        message: "jobId and resume file are required"
      });
    }

    const candidate = await Candidate.create({
      jobId,
      resume: req.file.path
    });

    res.status(201).json({
      message: "Application submitted successfully",
      candidate
    });
  } catch (error) {
    console.error("Candidate submit error:", error);
    res.status(500).json({
      message: "Failed to submit application"
    });
  }
});

/* ---------- GET: ALL CANDIDATES (ADMIN) ---------- */
router.get("/", async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate("jobId", "title location jobType")
      .sort({ createdAt: -1 })
      .lean();

    const FALLBACK_RESUME = "uploads/resumes/default-resume.pdf";

    const safeCandidates = candidates.map(c => ({
      ...c,
      resume:
        c.resume && c.resume.startsWith("uploads/")
          ? `/${c.resume}`
          : FALLBACK_RESUME
    }));

    res.json(safeCandidates);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch candidates" });
  }
});


export default router;
