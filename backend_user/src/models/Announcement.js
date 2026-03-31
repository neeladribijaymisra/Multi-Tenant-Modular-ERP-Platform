import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    audience: { type: String, required: true },
    channel: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accept"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Announcement", announcementSchema);
