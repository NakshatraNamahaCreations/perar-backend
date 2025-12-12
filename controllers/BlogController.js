// controllers/BlogController.js
import Blog from '../models/Blog.js';
import fs from 'fs';
import path from 'path';

/**
 * Helper: returns true if path looks like a local file path we can unlink.
 * We consider local paths to NOT start with http(s) or data:
 */
const isLocalFile = (p) => {
  if (!p) return false;
  return !(p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:'));
};

/**
 * Remove a local file if it exists. Accepts paths like:
 *  - '/uploads/123-name.png'
 *  - 'uploads/123-name.png'
 * Will ignore full URLs.
 */
const unlinkIfLocal = (filePath) => {
  if (!filePath || !isLocalFile(filePath)) return;
  // normalize: remove leading slash if present
  const rel = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const abs = path.join(process.cwd(), rel);
  try {
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      console.log('Removed file:', abs);
    } else {
      console.warn('File not found (skip):', abs);
    }
  } catch (err) {
    console.warn('Unable to remove file:', abs, err.message);
  }
};

/* CREATE */
export const createBlog = async (req, res) => {
  try {
    const { title, city = '', metaTitle = '', metaDescription = '', description = '', services = [], faqs = [], redirectLink = '' } = req.body;

    // files uploaded by multer (if any)
    const files = req.files || {};
    const bannerImage = files.bannerImage?.[0]?.path || req.body.bannerImage || '';
    const extraImage = files.extraImage?.[0]?.path || req.body.extraImage || '';

    // try parse arrays if sent as JSON strings from form-data
    let servicesArr = services;
    let faqsArr = faqs;
    if (typeof services === 'string') {
      try { servicesArr = JSON.parse(services); } catch { servicesArr = services.split?.(',')?.map(s => s.trim()) || []; }
    }
    if (typeof faqs === 'string') {
      try { faqsArr = JSON.parse(faqs); } catch { faqsArr = []; }
    }

    const blog = new Blog({
      title,
      city,
      metaTitle,
      metaDescription,
      description,
      bannerImage,
      extraImage,
      services: servicesArr,
      faqs: faqsArr,
      redirectLink,
      createdBy: req.user?.id || null, // if you use auth middleware
    });

    const saved = await blog.save();
    return res.status(201).json({ message: 'Blog created', blog: saved });
  } catch (err) {
    console.error('createBlog error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/* READ (list) */
export const getBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, city } = req.query;
    const q = {};
    if (search) q.title = { $regex: search, $options: 'i' };
    if (city && city !== 'All') q.city = city;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.max(1, parseInt(limit, 10) || 20);

    const [docs, total] = await Promise.all([
      Blog.find(q)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * lim)
        .limit(lim)
        .lean(),
      Blog.countDocuments(q),
    ]);

    const totalPages = Math.ceil(total / lim) || 1;

    return res.json({
      data: docs,
      page: pageNum,
      total,
      totalPages,
    });
  } catch (err) {
    console.error('getBlogs error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/* READ single */
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id).lean();
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    return res.json(blog);
  } catch (err) {
    console.error('getBlogById error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/* UPDATE */
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, city, metaTitle, metaDescription, description, services, faqs, redirectLink } = req.body;
    const files = req.files || {};

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    // if new files uploaded, remove old files safely
    if (files.bannerImage?.[0]?.path) {
      unlinkIfLocal(blog.bannerImage);
      blog.bannerImage = files.bannerImage[0].path;
    }
    if (files.extraImage?.[0]?.path) {
      unlinkIfLocal(blog.extraImage);
      blog.extraImage = files.extraImage[0].path;
    }

    if (title !== undefined) blog.title = title;
    if (city !== undefined) blog.city = city;
    if (metaTitle !== undefined) blog.metaTitle = metaTitle;
    if (metaDescription !== undefined) blog.metaDescription = metaDescription;
    if (description !== undefined) blog.description = description;
    if (redirectLink !== undefined) blog.redirectLink = redirectLink;

    // handle array fields if strings
    if (services !== undefined) {
      if (typeof services === 'string') {
        try { blog.services = JSON.parse(services); } catch { blog.services = services.split?.(',')?.map(s => s.trim()) || []; }
      } else blog.services = services;
    }
    if (faqs !== undefined) {
      if (typeof faqs === 'string') {
        try { blog.faqs = JSON.parse(faqs); } catch { blog.faqs = []; }
      } else blog.faqs = faqs;
    }

    const saved = await blog.save();
    return res.json({ message: 'Blog updated', blog: saved });
  } catch (err) {
    console.error('updateBlog error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};

/* DELETE */
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Blog.findById(id);
    if (!doc) return res.status(404).json({ message: 'Blog not found' });

    // remove local files (if stored locally)
    unlinkIfLocal(doc.bannerImage);
    unlinkIfLocal(doc.extraImage);

    await Blog.findByIdAndDelete(id);
    return res.json({ message: 'Blog deleted' });
  } catch (err) {
    console.error('deleteBlog error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  }
};
