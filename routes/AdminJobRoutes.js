// routes/adminJobRoutes.js
import express from "express";
import { body, param, query, validationResult } from "express-validator";
import sanitizeHtml from "sanitize-html";
import slugify from "slugify";

import Job from "../models/Job.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Helper: run express-validator results
 */
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

/**
 * Utility: ensure slug is unique. If slug exists, append short suffix.
 */
const makeUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let exists = await Job.findOne({ slug });
  // append a small suffix if collision
  while (exists) {
    const suffix = "-" + Math.random().toString(36).slice(2, 6);
    slug = `${baseSlug}${suffix}`;
    // eslint-disable-next-line no-await-in-loop
    exists = await Job.findOne({ slug });
  }
  return slug;
};

/**
 * CREATE job
 * POST /api/admin/jobs
 */
router.post(
  "/",
  protectAdmin,
  [
    body("title").isString().trim().isLength({ min: 3, max: 200 }),
    body("location").optional().isString().trim().isLength({ max: 200 }),
    body("type")
      .optional()
      .isIn(["full-time", "part-time", "contract", "internship", "remote"]),
    body("status").optional().isIn(["published", "draft"]),
    body("salary").optional().isString().trim().isLength({ max: 100 }),
    body("slug").optional().isString().trim().isLength({ min: 3, max: 250 }),
    body("description").optional().isString().isLength({ max: 20000 }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const data = req.body;

      // sanitize HTML (description) to strip dangerous HTML
      if (data.description) {
        data.description = sanitizeHtml(data.description, {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(["h1", "h2"]),
          allowedAttributes: {
            a: ["href", "name", "target"],
            img: ["src", "alt"],
          },
          allowedSchemes: ["http", "https", "mailto"],
        });
      }

      // build slug
      const baseSlug =
        data.slug && data.slug.trim()
          ? slugify(data.slug, { lower: true, strict: true })
          : slugify(data.title || "job", { lower: true, strict: true });

      const slug = await makeUniqueSlug(baseSlug);

      const job = await Job.create({ ...data, slug });
      res.status(201).json(job);
    } catch (err) {
      console.error("Create job error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * LIST all jobs (admin – includes drafts)
 * GET /api/admin/jobs
 * supports: ?page=1&limit=20&status=published|draft&search=term
 */
router.get(
  "/",
  protectAdmin,
  [
    query("page").optional().toInt(),
    query("limit").optional().toInt(),
    query("status").optional().isIn(["published", "draft"]),
    query("search").optional().isString().trim().isLength({ min: 1 }),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const page = Math.max(1, req.query.page || 1);
      const limit = Math.min(100, req.query.limit || 20);
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.status) filter.status = req.query.status;

      if (req.query.search) {
        const q = req.query.search;
        filter.$or = [
          { title: { $regex: q, $options: "i" } },
          { description: { $regex: q, $options: "i" } },
          { location: { $regex: q, $options: "i" } },
        ];
      }

      const [jobs, total] = await Promise.all([
        Job.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Job.countDocuments(filter),
      ]);

      res.json({
        data: jobs,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      });
    } catch (err) {
      console.error("List jobs (admin) error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * UPDATE job (partial/full)
 * PUT /api/admin/jobs/:id
 */
router.put(
  "/:id",
  protectAdmin,
  [
    param("id").isMongoId(),
    body("title").optional().isString().trim().isLength({ min: 3, max: 200 }),
    body("slug").optional().isString().trim().isLength({ min: 3, max: 250 }),
    body("description").optional().isString().isLength({ max: 20000 }),
    body("status").optional().isIn(["published", "draft"]),
  ],
  handleValidation,
  async (req, res) => {
    try {
      const updates = { ...req.body };

      // sanitize description if present
      if (updates.description) {
        updates.description = sanitizeHtml(updates.description, {
          allowedTags: sanitizeHtml.defaults.allowedTags,
          allowedAttributes: {
            a: ["href", "name", "target"],
            img: ["src", "alt"],
          },
        });
      }

      // if slug provided, ensure uniqueness
      if (updates.slug) {
        const baseSlug = slugify(updates.slug, { lower: true, strict: true });
        updates.slug = await makeUniqueSlug(baseSlug);
      }

      const job = await Job.findByIdAndUpdate(req.params.id, updates, {
        new: true,
      });

      if (!job) return res.status(404).json({ message: "Job not found" });

      res.json(job);
    } catch (err) {
      console.error("Update job error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * DELETE job
 * DELETE /api/admin/jobs/:id
 */
router.delete(
  "/:id",
  protectAdmin,
  [param("id").isMongoId()],
  handleValidation,
  async (req, res) => {
    try {
      const job = await Job.findByIdAndDelete(req.params.id);
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json({ message: "Job deleted" });
    } catch (err) {
      console.error("Delete job error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * CHANGE status (publish/unpublish)
 * PATCH /api/admin/jobs/:id/status
 * body: { status: "published" | "draft" }
 */
router.patch(
  "/:id/status",
  protectAdmin,
  [param("id").isMongoId(), body("status").isIn(["published", "draft"])],
  handleValidation,
  async (req, res) => {
    try {
      const { status } = req.body;
      const job = await Job.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!job) return res.status(404).json({ message: "Job not found" });
      res.json(job);
    } catch (err) {
      console.error("Change status error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
