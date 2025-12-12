// controllers/BlogController.js
import Blog from "../models/Blog.js";
import fs from "fs";
import path from "path";

/**
 * Helper: remove file if exists
 */
function removeFileIfExists(filePath) {
  if (!filePath) return;
  const full = path.join(process.cwd(), filePath);
  fs.unlink(full, (err) => {
    if (err) {
      // console.warn("Failed to remove file:", full, err.message);
    }
  });
}

export const createBlog = async (req, res, next) => {
  try {
    // multer puts files in req.files (object) or req.file
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

    if (!title || !metaTitle || !metaDescription || !description) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const blog = new Blog({
      city: city || "",
      title,
      metaTitle,
      metaDescription,
      description,
      services: services ? (typeof services === "string" ? JSON.parseSafe?.(services) ?? JSON.parse(services) : services) : [],
      faqs: faqs ? (typeof faqs === "string" ? JSON.parse(faqs) : faqs) : [],
      redirectLink: redirectLink || "",
    });

    // handle uploaded files from multer (fields: bannerImage, extraImage)
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
    if (services) existing.services = typeof services === "string" ? JSON.parse(services) : services;
    if (faqs) existing.faqs = typeof faqs === "string" ? JSON.parse(faqs) : faqs;
    if (redirectLink !== undefined) existing.redirectLink = redirectLink;

    // files
    if (req.files) {
      if (req.files.bannerImage && req.files.bannerImage[0]) {
        // remove old file (if present)
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
