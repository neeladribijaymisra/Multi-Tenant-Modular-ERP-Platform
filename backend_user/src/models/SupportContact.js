import mongoose from "mongoose";

const supportContactSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    department: { type: String, required: true },
    semester: { type: Number, required: true },
    section: { type: String, required: true },
    classCoordinatorName: { type: String, required: true },
    classCoordinatorEmail: { type: String, required: true },
    classCoordinatorPhone: { type: String, required: true },
    mentorName: { type: String, required: true },
    mentorEmail: { type: String, required: true },
    mentorPhone: { type: String, required: true },
    mentorRoom: { type: String, default: "" },
  },
  { timestamps: true },
);

supportContactSchema.index({ tenantSlug: 1, department: 1, semester: 1, section: 1 }, { unique: true });

export default mongoose.model("SupportContact", supportContactSchema);
