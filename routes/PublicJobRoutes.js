// routes/publicJobRoutes.js
import express from "express";
import Job from "../models/Job.js";

const router = express.Router();

// GET /api/jobs -> list published jobs
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "published" })
      .sort({ createdAt: -1 })
      .select("-__v");
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/jobs/:slug -> single published job
router.get("/:slug", async (req, res) => {
  try {
    const job = await Job.findOne({ slug: req.params.slug, status: "published" });
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
