// models/Job.js
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    location: { type: String, required: true },
    department: { type: String },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      default: "Full-time",
    },
    workMode: {
      type: String,
      enum: ["Onsite", "Hybrid", "Remote"],
      default: "Onsite",
    },

    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    responsibilities: { type: String },
    requirements: { type: String },
    skills: [String],

    applicationEmail: { type: String },
    applicationLink: { type: String },

    applicationDeadline: { type: Date },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    showOnHomepage: { type: Boolean, default: false },

    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);
export default Job;
