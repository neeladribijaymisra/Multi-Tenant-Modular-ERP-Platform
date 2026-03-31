import mongoose from "mongoose";

const campusEventSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    year: {
      type: Number,
      enum: [2026, 2027],
      required: true,
    },
    eventName: { type: String, required: true },
    eventType: { type: String, default: "General" },
    venue: { type: String, required: true },
    eventDate: { type: String, required: true },
    coordinator: { type: String, required: true },
    audience: { type: String, required: true },
  },
  { timestamps: true },
);

export default mongoose.model("CampusEvent", campusEventSchema);
