import mongoose from "mongoose";

const campusEventSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    eventName: { type: String, required: true },
    venue: { type: String, required: true },
    eventDate: { type: String, required: true },
    coordinator: { type: String, required: true },
    audience: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("CampusEvent", campusEventSchema);
