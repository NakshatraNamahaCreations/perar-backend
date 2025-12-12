// models/Blog.js
import mongoose from "mongoose";

const FaqSchema = new mongoose.Schema({
  question: { type: String, default: "" },
  answer: { type: String, default: "" },
});

const BlogSchema = new mongoose.Schema({
  city: { type: String, default: "" },
  title: { type: String, required: true },
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  description: { type: String, default: "" }, // HTML
  bannerImage: { type: String, default: "" }, // path like /uploads/xxx.jpg
  extraImage: { type: String, default: "" },
  services: [{ type: String }],
  faqs: [FaqSchema],
  redirectLink: { type: String, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

BlogSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
