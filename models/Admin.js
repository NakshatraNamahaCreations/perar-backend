// backend/models/Admin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

/**
 * Pre-save hook: hash password when it's new or modified.
 * NOTE: do not include `next` parameter when using async function.
 */
adminSchema.pre("save", async function () {
  // `this` is the document
  if (!this.isModified("password")) return; // nothing to do
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // no next() — returning / finishing the async function is enough
});

export default mongoose.model("Admin", adminSchema);
