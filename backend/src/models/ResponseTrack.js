import mongoose from "mongoose";

const responseTrackSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    sourceType: { type: String, required: true },
    title: { type: String, required: true },
    responseRate: { type: Number, required: true },
    escalations: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("ResponseTrack", responseTrackSchema);
