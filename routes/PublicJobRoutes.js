// routes/publicJobRoutes.js
import express from "express";
import { query, param, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import Job from "../models/Job.js";

const router = express.Router();

// Helper: express-validator wrapper
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

// Sanitize HTML for safety
const cleanJob = (job) => {
  if (!job?.description) return job;

  const cleanDesc = sanitizeHtml(job.description, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2"]),
    allowedAttributes: {
      a: ["href", "name", "target"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"]
  });

  return {
    ...job.toObject(),
    description: cleanDesc
  };
};

/**
 * GET /api/jobs
 * Public listing – only published jobs
 * supports:
 *  - ?page=1
 *  - ?limit=20
 *  - ?search=developer
 *  - ?type=full-time
 *  - ?location=Mysore
 *  - ?fields=title,location,type,slug
 */
router.get(
  "/",
  [
    query("page").optional().toInt(),
    query("limit").optional().toInt(),
    query("type").optional().isString().trim(),
    query("location").optional().isString().trim(),
    query("search").optional().isString().trim(),
    query("fields").optional().isString(),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const page = Math.max(1, req.query.page || 1);
      const limit = Math.min(50, req.query.limit || 20); // protect server
      const skip = (page - 1) * limit;

      // Base filter: only published jobs
      const filter = { status: "published" };

      // Filtering by type
      if (req.query.type) {
        filter.type = req.query.type;
      }

      // Filtering by location (partial match)
      if (req.query.location) {
        filter.location = { $regex: req.query.location, $options: "i" };
      }

      // Search across title, description, location
      if (req.query.search) {
        const q = req.query.search;
        filter.$or = [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } },
        ];
      }

      // Field selection logic
      let fields = "-__v"; // default
      if (req.query.fields) {
        fields = req.query.fields.split(",").join(" ");
      }

      // Fetch jobs + total count
      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .select(fields)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Job.countDocuments(filter)
      ]);

      // Sanitize HTML descriptions
      const cleanedJobs = jobs.map(cleanJob);

      return res.json({
        data: cleanedJobs,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err) {
      console.error("Public job list error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * GET /api/jobs/:slug
 * Single published job
 */
router.get(
  "/:slug",
  [param("slug").isString().trim().isLength({ min: 3 })],
  handleValidation,
  async (req, res) => {
    try {
      const job = await Job.findOne({
        slug: req.params.slug,
        status: "published"
      });

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      return res.json(cleanJob(job));
    } catch (err) {
      console.error("Public job detail error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
