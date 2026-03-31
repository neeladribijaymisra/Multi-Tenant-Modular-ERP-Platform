import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    tenantSlug: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "academic", "communication"],
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    managedByAcademic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

userSchema.index({ tenantSlug: 1, role: 1, username: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
