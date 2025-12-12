// controllers/BlogController.js  (replace previous createBlog)
export const createBlog = async (req, res, next) => {
  try {
    console.log("=== createBlog: headers.content-type ->", req.headers["content-type"]);
    console.log("=== createBlog: raw req.body ->", req.body);
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

    const {
      city = "",
      title,
      metaTitle = "",
      metaDescription = "",
      description,
      services,
      faqs,
      redirectLink = "",
    } = req.body || {};

    // require only title and description
    const missing = [];
    if (!title || typeof title !== "string" || title.trim().length === 0) missing.push("title");
    if (!description || typeof description !== "string" || description.trim().length === 0) missing.push("description");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: " + missing.join(", "),
      });
    }

    const blog = new Blog({
      city,
      title: title.trim(),
      metaTitle: metaTitle ? metaTitle.trim() : "",
      metaDescription: metaDescription ? metaDescription.trim() : "",
      description,
      services: Array.isArray(services) ? services : (parseJSONSafe(services) || []),
      faqs: Array.isArray(faqs) ? faqs : (parseJSONSafe(faqs) || []),
      redirectLink,
    });

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
