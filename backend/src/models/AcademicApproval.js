import mongoose from "mongoose";

const academicApprovalSchema = new mongoose.Schema(
  {
    tenantSlug: { type: String, required: true, index: true },
    itemType: { type: String, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accept"],
      default: "pending",
    },
    requestedBy: { type: String, required: true },
    approvedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.model("AcademicApproval", academicApprovalSchema);
