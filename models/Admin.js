// models/Admin.js (make sure you have this)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model("Admin", adminSchema);
