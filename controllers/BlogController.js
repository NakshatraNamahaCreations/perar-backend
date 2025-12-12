// controllers/BlogController.js
import Blog from "../models/Blog.js";
import fs from "fs";
import path from "path";
import parseJSONSafe from "../utils/parseJSONSafe.js";

/* remove a local file path (safe)
   filePath is like "uploads/123-name.jpg" or "/uploads/123.jpg" */
function removeFileIfExists(filePath) {
  if (!filePath) return;
  const normalized = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const full = path.join(process.cwd(), normalized);
  fs.unlink(full, (err) => {
    if (err) {
      // optional: console.warn("Could not delete file", full, err.message);
    }
  });
}

export const createBlog = async (req, res, next) => {
  try {
    // >>> DEBUG: show incoming headers / body / files
    console.log("=== createBlog: headers.content-type ->", req.headers["content-type"]);
    console.log("=== createBlog: raw req.body ->", req.body);
    // summarize files (avoid huge output)
    if (req.files) {
      const filesSummary = Object.keys(req.files).reduce((acc, key) => {
        acc[key] = req.files[key].map(f => ({
          fieldname: f.fieldname,
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          path: f.path
        }));
        return acc;
      }, {});
      console.log("=== createBlog: req.files summary ->", JSON.stringify(filesSummary, null, 2));
    } else {
      console.log("=== createBlog: req.files ->", req.files);
    }
    // >>> end debug

    // Fields come from multipart/form-data
    const {
      city,
      title,
      metaTitle,
      metaDescription,
      description,
      services,
      faqs,
      redirectLink,
    } = req.body || {};

    // Safer validation (trim strings)
    const required = [title, metaTitle, metaDescription, description];
    const ok = required.every((v) => typeof v === "string" && v.trim().length > 0);
    if (!ok) {
      console.warn("createBlog: Validation failed - required fields missing or empty");
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const blog = new Blog({
      city: city || "",
      title: title.trim(),
      metaTitle: metaTitle.trim(),
      metaDescription: metaDescription.trim(),
      description,
      services: Array.isArray(services) ? services : (parseJSONSafe(services) || []),
      faqs: Array.isArray(faqs) ? faqs : (parseJSONSafe(faqs) || []),
      redirectLink: redirectLink || "",
    });

    // files handled by multer: req.files.bannerImage, req.files.extraImage
    if (req.files) {
      if (req.files.bannerImage && req.files.bannerImage[0]) {
        blog.bannerImage = `/${req.files.bannerImage[0].path.replace(/\\/g, "/")}`;
      }
      if (req.files.extraImage && req.files.extraImage[0]) {
        blog.extraImage = `/${req.files.extraImage[0].path.replace(/\\/g, "/")}`;
      }
    }

    const saved = await blog.save();
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
};


export const getBlogs = async (req, res, next) => {
  try {
    const { city, limit = 20, skip = 0 } = req.query;
    const q = {};
    if (city) q.city = city;
    const blogs = await Blog.find(q).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit));
    res.json({ success: true, data: blogs });
  } catch (err) {
    next(err);
  }
};

export const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: blog });
  } catch (err) {
    next(err);
  }
};

export const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Blog.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });

    const {
      city,
      title,
      metaTitle,
      metaDescription,
      description,
      services,
      faqs,
      redirectLink,
    } = req.body;

    if (title) existing.title = title;
    if (metaTitle) existing.metaTitle = metaTitle;
    if (metaDescription) existing.metaDescription = metaDescription;
    if (description) existing.description = description;
    if (city !== undefined) existing.city = city;
    if (services) existing.services = Array.isArray(services) ? services : parseJSONSafe(services);
    if (faqs) existing.faqs = Array.isArray(faqs) ? faqs : parseJSONSafe(faqs);
    if (redirectLink !== undefined) existing.redirectLink = redirectLink;

    // files (replace + cleanup)
    if (req.files) {
      if (req.files.bannerImage && req.files.bannerImage[0]) {
        if (existing.bannerImage) removeFileIfExists(existing.bannerImage);
        existing.bannerImage = `/${req.files.bannerImage[0].path.replace(/\\/g, "/")}`;
      }
      if (req.files.extraImage && req.files.extraImage[0]) {
        if (existing.extraImage) removeFileIfExists(existing.extraImage);
        existing.extraImage = `/${req.files.extraImage[0].path.replace(/\\/g, "/")}`;
      }
    }

    const updated = await existing.save();
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Blog.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Not found" });

    // delete files if stored locally
    if (existing.bannerImage) removeFileIfExists(existing.bannerImage);
    if (existing.extraImage) removeFileIfExists(existing.extraImage);

    await existing.remove();
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
