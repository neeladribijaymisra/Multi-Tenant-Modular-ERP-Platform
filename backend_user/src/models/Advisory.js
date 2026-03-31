import mongoose from "mongoose";

const advisorySchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    teacherName: { type: String, required: true },
    targetAudience: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Advisory", advisorySchema);
