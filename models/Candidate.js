import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    resume: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Candidate", candidateSchema);
