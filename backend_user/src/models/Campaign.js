import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    title: { type: String, required: true },
    audience: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accept"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Campaign", campaignSchema);
