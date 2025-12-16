import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    jobTitle: {
      type: String,
      required: true
    },
    resume: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

candidateSchema.index({ createdAt: -1 });

export default mongoose.model("Candidate", candidateSchema);
